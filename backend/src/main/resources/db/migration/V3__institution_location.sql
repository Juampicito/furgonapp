-- Existing institutions remain intact until their owner confirms their location.
ALTER TABLE institution ADD COLUMN place_id varchar(255);
ALTER TABLE institution ADD COLUMN latitude double precision;
ALTER TABLE institution ADD COLUMN longitude double precision;
ALTER TABLE institution ADD CONSTRAINT institution_location_valid CHECK (
  (place_id IS NULL AND latitude IS NULL AND longitude IS NULL) OR
  (place_id IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
   AND latitude IS NOT NULL AND longitude IS NOT NULL)
);
