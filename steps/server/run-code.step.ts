import { ApiRouteConfig, Handlers } from "motia";
import puppeteer from "puppeteer";
import { supabase } from "../services/supabase/supabase";

export const config: ApiRouteConfig = {
  type: "api",
  name: "RunCode",
  path: "/run-code",
  method: "GET",
  flows: ["ServerManagement"],
  emits: [],
};

export const handler: Handlers["RunCode"] = async (req, { logger }) => {
  logger.info("CODE IS RUNNING");

  // Send the requests to create the server
  const domain = "testcompany.cv";
  try {
    logger.info("SET UP THE BROWSER");
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    logger.info("LOGGING INTO MAILCOW");
    await page.goto(`https://mail.${domain}/admin/`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await page.locator('input[id="login_user"]').fill("admin");
    await page.locator('input[id="pass_user"]').fill("moohoo");
    await page.click('button[type="submit"]');

    logger.info("GO TO THE CONFIGURATION PAGE");
    await page.goto(`https://mail.${domain}/admin/system`);
    logger.info("CLICK ON API");
    await page.locator('legend[data-bs-target="#admin_api"]').click();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // 1. Get all the container elements
    let containers = await page.$$("div.col-lg-6");
    let lastContainer = containers[containers.length - 1];

    logger.info("CLICK ON SKIP IP CHECK");
    const skipIpInput = await lastContainer.$('input[name="skip_ip_check"]');
    await skipIpInput?.click();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info("ACTIVATE API");
    const activeInput = await lastContainer.$('input[name="active"]');
    await activeInput?.click();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info("SAVE CHANGE");
    const saveButton = await lastContainer.$('button[name="admin_api[rw]"]');
    await saveButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 5000));

    logger.info("WAIT FOR PAGE TO REFRESH");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    logger.info("CLICK ON API AND COPY THE API TOKEN");
    await page.locator('legend[data-bs-target="#admin_api"]').click();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    containers = await page.$$("div.col-lg-6");
    lastContainer = containers[containers.length - 1];

    const apiTokenEl = await lastContainer.$('input[type="text"]');
    const apiToken = await apiTokenEl?.evaluate((el) =>
      el.getAttribute("value"),
    );

    logger.info("CLOSING THE BROWSER");

    await browser.close();

    // Update the database with the api token
    const { data, error } = await supabase.from("mailcow").insert({
      domain: domain,
      token: apiToken,
    });

    if (error) {
      logger.error(`Unable to save the token into the database - ${error}`);
    }
    logger.info("API KEY RETRIEVE");
    return { status: 200, body: { token: apiToken } };
  } catch (error) {
    logger.error(`Error getting the api token - ${error}`);
    return { status: 503, body: { error: error } };
  }
};
