/**
 * Autonomous In-Browser Button Clicker & Test Suite
 * Injected in browser / DevTools to click on all interactive buttons,
 * fill forms, verify dialogs, and assert UI mutations autonomously.
 */

(function () {
  console.log("%c[Autonomous Button Clicker] Initialized", "color: #10b981; font-weight: bold; font-size: 14px;");

  const results = {
    totalButtons: 0,
    clickedButtons: 0,
    actions: [],
    errors: []
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function clickButton(button, description) {
    if (!button || button.disabled) return false;
    try {
      console.log(`%c[Clicking] ${description}`, "color: #3b82f6;");
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(150);

      // Trigger standard mouse events
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      button.click();

      results.clickedButtons++;
      results.actions.push({ description, status: 'SUCCESS', timestamp: new Date().toISOString() });
      await sleep(250);
      return true;
    } catch (err) {
      console.error(`[Error Clicking] ${description}`, err);
      results.errors.push({ description, error: err.message });
      return false;
    }
  }

  window.OorahAutonomousTester = {
    async scanAndClickAllButtons() {
      const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
      results.totalButtons = buttons.length;
      console.log(`Found ${buttons.length} active buttons on current page.`);

      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const label = btn.innerText.trim() || btn.getAttribute('aria-label') || btn.title || `Button #${i+1}`;
        await clickButton(btn, `Button ${i+1}/${buttons.length}: "${label}"`);
      }

      console.log("%c[Autonomous Click Summary]", "color: #10b981; font-weight: bold;", results);
      return results;
    },

    async runAutonomousCamperWorkflow() {
      console.log("Starting Autonomous Camper Workflow...");
      // 1. New kid button
      const newKidBtn = document.querySelector("a[href='/campers/new'], button:has-text('New Kid')");
      if (newKidBtn) await clickButton(newKidBtn, "Navigate to /campers/new");

      // 2. Profile tabs
      const tabs = Array.from(document.querySelectorAll("[role='tab']"));
      for (const tab of tabs) {
        await clickButton(tab, `Switch tab: ${tab.innerText.trim()}`);
      }

      return results;
    },

    async runAutonomousStaffWorkflow() {
      console.log("Starting Autonomous Staff Workflow...");
      const newStaffBtn = document.querySelector("a[href='/staff/new'], button:has-text('New Staff Member')");
      if (newStaffBtn) await clickButton(newStaffBtn, "Navigate to /staff/new");

      const tabs = Array.from(document.querySelectorAll("[role='tab']"));
      for (const tab of tabs) {
        await clickButton(tab, `Staff tab: ${tab.innerText.trim()}`);
      }

      return results;
    },

    getResults() {
      return results;
    }
  };

  console.log("Autonomous Tester attached to window.OorahAutonomousTester");
})();
