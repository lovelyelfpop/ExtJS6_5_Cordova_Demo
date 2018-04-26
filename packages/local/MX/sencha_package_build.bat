@echo off
set package=modern-ux_6_5_2
title Build %package%

set currentpath=%~dp0
set buildpath=%~dp0..\..\..\build

cd /d %currentpath%
call sencha package build

call sencha package remove %package%

cd /d %buildpath%\%package%
call sencha package add %package%.pkg

pause