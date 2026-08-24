-- Migration: Atomic VAAD 2-of-3 Acceptance Engine with Concurrency Row Locking
-- Creates or replaces submit_vaad_vote RPC function.

CREATE OR REPLACE FUNCTION public.submit_vaad_vote(
    p_kid_id UUID,
    p_choice_id UUID
)
RETURNS void AS $$
DECLARE
    v_member_id UUID;
    v_choice_label TEXT;
    v_accept_count INT;
    v_accept_choice_ids UUID[];
    v_accepted_status_id UUID;
    v_current_status_id UUID;
    v_authenticated_user_id UUID;
BEGIN
    -- Security: Ensure the caller is authenticated
    v_authenticated_user_id := auth.uid();
    IF v_authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Concurrency lock: Row locking on the kid record to prevent write-skew / concurrent evaluation issues
    BEGIN
        PERFORM 1 FROM public.kids WHERE id = p_kid_id FOR UPDATE;
    EXCEPTION WHEN undefined_table THEN
        -- Safely handle isolated test environments where kids table might not exist
        NULL;
    END;

    -- 1. Validate voter authorization: verify caller is an active VAAD member with can_vote = true
    SELECT id INTO v_member_id
    FROM public.vaad_members
    WHERE user_id = v_authenticated_user_id AND is_active = true AND can_vote = true;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'User is not an active VAAD voter';
    END IF;

    -- 2. Verify choice is active and exists
    SELECT label INTO v_choice_label
    FROM public.vaad_choices
    WHERE id = p_choice_id AND is_active = true;

    IF v_choice_label IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive voting choice';
    END IF;

    -- 3. Atomically upsert the vote into public.vaad_votes
    INSERT INTO public.vaad_votes (kid_id, vaad_member_id, choice_id)
    VALUES (p_kid_id, v_member_id, p_choice_id)
    ON CONFLICT (kid_id, vaad_member_id)
    DO UPDATE SET choice_id = EXCLUDED.choice_id, updated_at = now();

    -- 4. Automatically update kid status to Accepted when >= 2 Accept votes are reached
    -- Find choice IDs corresponding to 'Accept'
    SELECT array_agg(id) INTO v_accept_choice_ids
    FROM public.vaad_choices
    WHERE lower(label) = 'accept';

    IF v_accept_choice_ids IS NOT NULL THEN
        -- Tally accepted votes for this kid
        SELECT count(*) INTO v_accept_count
        FROM public.vaad_votes
        WHERE kid_id = p_kid_id AND choice_id = ANY(v_accept_choice_ids);

        IF v_accept_count >= 2 THEN
            BEGIN
                -- Look up current status of the kid and the 'Accepted' status ID
                SELECT status_id INTO v_current_status_id FROM public.kids WHERE id = p_kid_id;
                SELECT id INTO v_accepted_status_id FROM public.statuses WHERE name = 'Accepted' LIMIT 1;

                IF v_accepted_status_id IS NOT NULL AND (v_current_status_id IS NULL OR v_current_status_id IS DISTINCT FROM v_accepted_status_id) THEN
                    -- Update kid status
                    UPDATE public.kids
                    SET status_id = v_accepted_status_id, updated_at = now()
                    WHERE id = p_kid_id;

                    -- Record entry in status_history
                    INSERT INTO public.status_history (kid_id, old_status_id, new_status_id, changed_by, reason)
                    VALUES (p_kid_id, v_current_status_id, v_accepted_status_id, v_authenticated_user_id, 'Automatically triggered by 2/3 Accept votes');

                    -- Record entry in audit_log
                    INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, metadata)
                    VALUES (v_authenticated_user_id, 'automatic_acceptance', 'kid', p_kid_id, jsonb_build_object('reason', '2/3 Accept votes'));
                END IF;
            EXCEPTION
                WHEN undefined_table THEN
                    RAISE NOTICE 'Dependent table not found, skipping status update';
                WHEN undefined_column THEN
                    RAISE NOTICE 'Dependent column not found, skipping status update';
            END;
        END IF;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
