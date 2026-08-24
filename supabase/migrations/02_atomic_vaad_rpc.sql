-- Migration 02: Atomic VAAD Voting Stored Procedure with Concurrency Locking

CREATE OR REPLACE FUNCTION public.submit_vaad_vote(
    p_kid_id UUID,
    p_choice_id UUID,
    p_comments TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voter_id UUID;
    v_is_voter BOOLEAN;
    v_accept_choice_id UUID;
    v_accepted_status_id UUID;
    v_current_status_id UUID;
    v_accept_count INT;
BEGIN
    v_voter_id := auth.uid();
    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Verify voter is an active VAAD member
    SELECT can_vote INTO v_is_voter
    FROM public.vaad_members
    WHERE user_id = v_voter_id AND active = true;

    IF v_is_voter IS NOT TRUE THEN
        RAISE EXCEPTION 'Caller is not authorized to cast VAAD votes';
    END IF;

    -- Concurrency row lock on kids table
    PERFORM 1 FROM public.kids WHERE id = p_kid_id FOR UPDATE;

    -- Upsert vote
    INSERT INTO public.vaad_votes (kid_id, voter_id, choice_id, comments, updated_at)
    VALUES (p_kid_id, v_voter_id, p_choice_id, p_comments, now())
    ON CONFLICT (kid_id, voter_id)
    DO UPDATE SET
        choice_id = EXCLUDED.choice_id,
        comments = EXCLUDED.comments,
        updated_at = now();

    -- Count total 'Accept' votes
    SELECT id INTO v_accept_choice_id FROM public.vaad_choices WHERE label = 'Accept' LIMIT 1;
    
    SELECT COUNT(*) INTO v_accept_count
    FROM public.vaad_votes
    WHERE kid_id = p_kid_id AND choice_id = v_accept_choice_id;

    -- If >= 2 Accept votes, automatically transition status to Accepted
    IF v_accept_count >= 2 THEN
        SELECT id INTO v_accepted_status_id FROM public.statuses WHERE name = 'Accepted' LIMIT 1;
        SELECT status_id INTO v_current_status_id FROM public.kids WHERE id = p_kid_id;

        IF v_accepted_status_id IS NOT NULL AND (v_current_status_id IS NULL OR v_current_status_id != v_accepted_status_id) THEN
            UPDATE public.kids SET status_id = v_accepted_status_id, updated_at = now() WHERE id = p_kid_id;
            
            INSERT INTO public.status_history (kid_id, old_status_id, new_status_id, changed_by, notes)
            VALUES (p_kid_id, v_current_status_id, v_accepted_status_id, v_voter_id, 'Automatic transition via VAAD 2-of-3 majority');
            
            INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, details)
            VALUES (v_voter_id, 'VAAD_AUTO_ACCEPT', 'kid', p_kid_id::text, jsonb_build_object('accept_votes', v_accept_count));
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'kid_id', p_kid_id, 'accept_count', v_accept_count);
END;
$$;
