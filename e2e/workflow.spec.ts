import { expect, test } from "@playwright/test";

test("upload, edit, scramble, move, and export workflow", async ({ page }) => {
  await page.goto("/");

  const participantsTab = page.getByRole("tab", { name: /Participants/i });
  const resultsTab = page.getByRole("tab", { name: /^Results$/i });
  await participantsTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(resultsTab).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(participantsTab).toBeFocused();

  await page.locator('input[type="file"]').setInputFiles("data/example.csv");

  await page.getByRole("button", { name: "Scramble!" }).click();
  await expect(page.getByRole("heading", { name: "Scramble Results" })).toBeFocused();
  await expect(page.getByText(/teams generated/i)).toBeAttached();

  const moveControl = page.getByLabel(/Move .* to another team/).first();
  await moveControl.selectOption({ index: 1 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("teams.csv");

  await page.getByRole("tab", { name: /Participants/i }).click();
  await page.getByRole("button", { name: "Edit row" }).first().click();
  await page.getByRole("textbox", { name: /Name for/i }).fill("Updated Participant");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("tab", { name: /^Results$/i }).click();
  await expect(page.getByText(/No results yet/i)).toBeVisible();
});
