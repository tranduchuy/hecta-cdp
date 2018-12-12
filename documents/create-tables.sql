-- MySQL Script generated by MySQL Workbench
-- Wed Dec 12 08:07:33 2018
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema cdp
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema cdp
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `cdp` DEFAULT CHARACTER SET utf8 ;
USE `cdp` ;

-- -----------------------------------------------------
-- Table `cdp`.`USER`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cdp`.`USER` ;

CREATE TABLE IF NOT EXISTS `cdp`.`USER` (
  `ID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `SUB_ID` VARCHAR(60) NULL COMMENT 'Save mongo _id from old database',
  `EMAIL` VARCHAR(100) NULL,
  `NAME` VARCHAR(100) NULL,
  `USER_NAME` VARCHAR(30) NULL,
  `PASSWORD_HASH` VARCHAR(200) NULL,
  `PASSWORD_SALT` VARCHAR(100) NULL,
  `TOKEN_EMAIL_CONFIRM` VARCHAR(50) NULL,
  `PASSWORD_REMINDER_TOKEN` VARCHAR(50) NULL,
  `PASSWORD_REMINDER_EXPIRE` TIMESTAMP(3) NULL,
  `CREATED_AT` TIMESTAMP(3) NULL,
  `UPDATED_AT` TIMESTAMP(3) NULL,
  `ADDRESS` VARCHAR(100) NULL,
  `PHONE` VARCHAR(11) NULL,
  `GENDER` INT NULL,
  `AGE` INT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `id_UNIQUE` (`ID` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdp`.`USER_LOGIN_TOKEN`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `cdp`.`USER_LOGIN_TOKEN` ;

CREATE TABLE IF NOT EXISTS `cdp`.`USER_LOGIN_TOKEN` (
  `ID` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `TOKEN` VARCHAR(100) NULL,
  `CREATED_AT` TIMESTAMP(3) NULL,
  `UPDATED_AT` TIMESTAMP(3) NULL,
  `EXPIRED_AT` TIMESTAMP(3) NULL,
  `USER_ID` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `ID_UNIQUE` (`ID` ASC) VISIBLE,
  INDEX `fk_USER_LOGIN_TOKEN_USER_idx` (`USER_ID` ASC) VISIBLE,
  CONSTRAINT `fk_USER_LOGIN_TOKEN_USER`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `cdp`.`USER` (`ID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
