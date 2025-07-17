-- Remove unused tables that are not related to coffee label functionality
DROP TABLE IF EXISTS analysis_reports CASCADE;
DROP TABLE IF EXISTS companies CASCADE; 
DROP TABLE IF EXISTS scan_results CASCADE;
DROP TABLE IF EXISTS ratio_coffee_recipes CASCADE;