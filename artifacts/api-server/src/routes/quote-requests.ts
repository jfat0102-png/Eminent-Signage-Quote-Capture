import { Router, type IRouter } from "express";
import { CreateQuoteRequestBody, CreateQuoteRequestResponse } from "@workspace/api-zod";
import { db, quoteRequestsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/quote-requests", async (req, res): Promise<void> => {
  const parsed = CreateQuoteRequestBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      { errors: parsed.error.issues.map((issue) => issue.path.join(".")) },
      "Rejected invalid quote request",
    );
    res.status(400).json({ error: "Please check the quote request details." });
    return;
  }

  const input = parsed.data;
  const name = input.name.trim();
  const description = input.description.trim();
  const contact = input.contact.trim();

  if (!name || !description || !contact) {
    res.status(400).json({ error: "Please complete all required fields." });
    return;
  }

  // Silently accept bot submissions caught by the form's honeypot without
  // storing them or revealing the filter to automated senders.
  if (input.companyWebsite?.trim()) {
    res.status(201).json(
      CreateQuoteRequestResponse.parse({
        id: 0,
        createdAt: new Date().toISOString(),
      }),
    );
    return;
  }

  const [saved] = await db
    .insert(quoteRequestsTable)
    .values({
      name,
      service: input.service,
      budget: input.budget?.trim() || null,
      description,
      contact,
    })
    .returning({
      id: quoteRequestsTable.id,
      createdAt: quoteRequestsTable.createdAt,
    });

  if (!saved) {
    req.log.error("Quote request insert returned no row");
    res.status(500).json({ error: "We couldn't save your request. Please try again." });
    return;
  }

  res.status(201).json(
    CreateQuoteRequestResponse.parse({
      id: saved.id,
      createdAt: saved.createdAt.toISOString(),
    }),
  );
});

export default router;
