-- Migration 002: add lat and lng columns to rios
BEGIN TRANSACTION;
ALTER TABLE rios ADD COLUMN lat REAL;
ALTER TABLE rios ADD COLUMN lng REAL;
COMMIT;
