CREATE TABLE calendar (
    date DATE PRIMARY KEY,
    day ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
);

-- Procedure To Generate calender Table

DELIMITER //

CREATE PROCEDURE InsertCalendarDates(IN start_date DATE, IN end_date DATE)
BEGIN
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_dates (date DATE);

    WHILE start_date <= end_date DO
        INSERT INTO temp_dates (date) VALUES (start_date);
        SET start_date = DATE_ADD(start_date, INTERVAL 1 DAY);
    END WHILE;

    INSERT INTO calendar (date, day)
    SELECT date, 
        CASE WEEKDAY(date)
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
        END
    FROM temp_dates;

    DROP TEMPORARY TABLE IF EXISTS temp_dates;
END//

DELIMITER ;
CALL InsertCalendarDates('2024-01-01', '2029-12-31');