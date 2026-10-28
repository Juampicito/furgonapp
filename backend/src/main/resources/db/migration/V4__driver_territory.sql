CREATE TABLE driver_territory_point (
  driver_id UUID NOT NULL REFERENCES driver_profile(id) ON DELETE CASCADE,
  point_order INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  PRIMARY KEY (driver_id, point_order)
);
ALTER TABLE quote ADD COLUMN pickup_latitude DOUBLE PRECISION;
ALTER TABLE quote ADD COLUMN pickup_longitude DOUBLE PRECISION;
