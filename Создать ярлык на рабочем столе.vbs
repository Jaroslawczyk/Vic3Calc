' ============================================================================
'  Создать ярлык на рабочем столе.vbs  /  Create desktop shortcut
' ---------------------------------------------------------------------------
'  EN: Run once. Puts a "Vic3 Calculator" icon on your Desktop that opens the
'      calculator directly - no console, no browser window, no installation.
'      Delete the icon whenever you like; nothing else is changed, and nothing
'      is written to the registry.
'
'  RU: Запустите один раз. На рабочем столе появится значок "Vic3 Calculator",
'      который открывает калькулятор напрямую - без консоли, без окна браузера
'      и без установки. Значок можно удалить в любой момент; больше ничего не
'      меняется, в реестр ничего не пишется.
' ============================================================================
Option Explicit

Dim fso, sh
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")

Dim appDir, launcher, iconFile, desktop, linkPath
appDir   = fso.GetParentFolderName(WScript.ScriptFullName)
launcher = fso.BuildPath(appDir, "Vic3Calculator.vbs")
iconFile = fso.BuildPath(appDir, "app\assets\vic3calc.ico")

If Not fso.FileExists(launcher) Then
    MsgBox "Vic3Calculator.vbs was not found next to this script." & vbCrLf & vbCrLf & _
           "Файл Vic3Calculator.vbs не найден рядом с этим скриптом.", _
           vbCritical, "Vic3 Calculator"
    WScript.Quit 1
End If

desktop  = sh.SpecialFolders("Desktop")
linkPath = fso.BuildPath(desktop, "Vic3 Calculator.lnk")

Dim lnk
Set lnk = sh.CreateShortcut(linkPath)
' Point at wscript.exe explicitly: a .lnk straight to a .vbs can be opened by
' an editor if the user has ever changed the .vbs file association.
lnk.TargetPath        = sh.ExpandEnvironmentStrings("%SystemRoot%\System32\wscript.exe")
lnk.Arguments         = """" & launcher & """"
lnk.WorkingDirectory  = appDir
lnk.Description       = "Victoria 3 Calculator - production chains, workforce and war"
lnk.WindowStyle       = 1
If fso.FileExists(iconFile) Then lnk.IconLocation = iconFile & ", 0"
lnk.Save

MsgBox "Done. A ""Vic3 Calculator"" icon is now on your Desktop." & vbCrLf & vbCrLf & _
       "Готово. Значок ""Vic3 Calculator"" появился на рабочем столе.", _
       vbInformation, "Vic3 Calculator"
