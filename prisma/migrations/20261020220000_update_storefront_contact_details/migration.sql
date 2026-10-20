UPDATE "StorefrontContent"
SET
    "content" = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set("content", '{contact,phone}', to_jsonb('+94 76 41 32 650'::text)),
                                '{contact,email}',
                                to_jsonb('primezorasolution@gmail.com'::text)
                            ),
                            '{contact,address}',
                            to_jsonb('Ehaliyagoda, Sri Lanka'::text)
                        ),
                        '{footer,phone}',
                        to_jsonb('+94 76 41 32 650'::text)
                    ),
                    '{footer,phoneHref}',
                    to_jsonb('tel:+94764132650'::text)
                ),
                '{footer,email}',
                to_jsonb('primezorasolution@gmail.com'::text)
            ),
            '{footer,emailHref}',
            to_jsonb('mailto:primezorasolution@gmail.com'::text)
        ),
        '{footer,address}',
        to_jsonb('Ehaliyagoda, Sri Lanka'::text)
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'storefront';

UPDATE "StorefrontContent"
SET
    "content" = jsonb_set(
        jsonb_set(
            "content",
            '{footer,addressHref}',
            to_jsonb('https://maps.google.com/?q=Ehaliyagoda,+Sri+Lanka'::text)
        ),
        '{footer,socials}',
        (
            SELECT COALESCE(
                jsonb_agg(
                    CASE
                        WHEN social.item->>'icon' = 'Facebook' THEN
                            jsonb_set(
                                social.item,
                                '{href}',
                                to_jsonb('https://www.facebook.com/profile.php?id=61592915424823&mibextid=ZbWKwL'::text),
                                true
                            )
                        WHEN social.item->>'icon' = 'WhatsApp' THEN
                            jsonb_set(
                                social.item,
                                '{href}',
                                to_jsonb('https://wa.me/94764132650'::text),
                                true
                            )
                        WHEN social.item->>'icon' = 'Email' THEN
                            jsonb_set(
                                social.item,
                                '{href}',
                                to_jsonb('mailto:primezorasolution@gmail.com'::text),
                                true
                            )
                        ELSE social.item
                    END
                    ORDER BY social.ordinality
                ),
                '[]'::jsonb
            )
            FROM jsonb_array_elements("content"->'footer'->'socials')
                WITH ORDINALITY AS social(item, ordinality)
        )
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'storefront';
