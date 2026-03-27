-- GameLog Database Schema
-- Azure SQL / SQL Server compatible

CREATE DATABASE GameLogDb;
GO

USE GameLogDb;
GO

-- Users table
CREATE TABLE Users (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    Email        NVARCHAR(256) NOT NULL UNIQUE,
    Username     NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    CreatedAt    DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Games table
CREATE TABLE Games (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Title       NVARCHAR(200) NOT NULL,
    Genre       NVARCHAR(100) NULL,
    ReleaseDate DATETIME2 NULL,
    CoverUrl    NVARCHAR(1000) NULL,
    GameMode    NVARCHAR(20) NOT NULL DEFAULT 'singleplayer',  -- singleplayer | multiplayer | both
    RawgId      NVARCHAR(100) NULL
);

-- UserGames junction table
CREATE TABLE UserGames (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    UserId   INT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    GameId   INT NOT NULL REFERENCES Games(Id) ON DELETE CASCADE,
    Status   NVARCHAR(20) NOT NULL DEFAULT 'backlog',  -- playing | completed | backlog | dropped
    Rating   INT NULL CHECK (Rating BETWEEN 0 AND 100),
    Notes    NVARCHAR(2000) NULL,
    AddedAt  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Platform NVARCHAR(50) NULL
);

-- PlayerProfiles table (for multiplayer games with Riot/Steam profiles)
CREATE TABLE PlayerProfiles (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    UserId   INT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    GameId   INT NOT NULL REFERENCES Games(Id),
    Nickname NVARCHAR(100) NOT NULL,
    Rank     NVARCHAR(100) NULL,
    Region   NVARCHAR(50) NULL
);

-- MultiplayerGames table (Riot/Steam sourced games)
CREATE TABLE MultiplayerGames (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Title       NVARCHAR(200) NOT NULL,
    Genre       NVARCHAR(100) NULL,
    ReleaseDate DATETIME2 NULL,
    CoverUrl    NVARCHAR(1000) NULL,
    GameMode    NVARCHAR(20) NOT NULL DEFAULT 'multiplayer',
    ApiSource   NVARCHAR(20) NULL,   -- riot | steam
    ExternalId  NVARCHAR(100) NULL
);

-- Ranks table (competitive rank history per player profile)
CREATE TABLE Ranks (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(100) NOT NULL,
    Tier            NVARCHAR(50) NULL,
    Points          INT NOT NULL DEFAULT 0,
    PlayerProfileId INT NOT NULL REFERENCES PlayerProfiles(Id) ON DELETE CASCADE
);

GO

-- Indexes for common query patterns
CREATE INDEX IX_UserGames_UserId ON UserGames(UserId);
CREATE INDEX IX_UserGames_GameId ON UserGames(GameId);
CREATE INDEX IX_PlayerProfiles_UserId ON PlayerProfiles(UserId);
CREATE INDEX IX_Games_Title ON Games(Title);
