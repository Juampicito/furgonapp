UPDATE app_user SET email = LOWER(TRIM(email));
ALTER TABLE app_user ADD CONSTRAINT ck_user_email_normalized CHECK (email = LOWER(TRIM(email)));
