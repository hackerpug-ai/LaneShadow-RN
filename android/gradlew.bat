@ECHO OFF
SETLOCAL
SET APP_HOME=%~dp0
SET GRADLE_VERSION=8.7
SET DIST_NAME=gradle-%GRADLE_VERSION%-bin
SET DIST_URL=https://services.gradle.org/distributions/%DIST_NAME%.zip
SET INSTALL_DIR=%USERPROFILE%\.gradle\wrapper\dists\%DIST_NAME%
SET GRADLE_BIN=%INSTALL_DIR%\gradle-%GRADLE_VERSION%\bin\gradle.bat

IF NOT EXIST "%GRADLE_BIN%" (
  ECHO Download and extraction are supported on Unix runners only in this bootstrap.
  EXIT /B 1
)

CALL "%GRADLE_BIN%" -p "%APP_HOME%" %*
ENDLOCAL
