' ============================================================================
'  Vic3Calculator.vbs - the launcher. Double-click this, or the desktop icon.
' ---------------------------------------------------------------------------
'  EN: WHAT THIS DOES AND WHY IT IS A SCRIPT
'
'      The calculator is a web page, but it must not FEEL like one: no address
'      bar, no tabs, no console window, no installation. So this script finds a
'      Chromium browser you already have (Edge is on every Windows 11 machine)
'      and starts it in "app mode", which opens a plain window with nothing in
'      it but the page.
'
'      It is a .vbs rather than a .bat because wscript.exe runs without ever
'      flashing a black console window.
'
'      The browser gets its own small profile folder under
'      %LOCALAPPDATA%\Vic3Calculator so that:
'        - the window is always a separate app window, never a browser tab,
'        - your saved chains and settings are kept apart from your browsing,
'        - nothing you do here can disturb your normal browser.
'
'      If no Chromium browser is found, we fall back to opening the page in
'      whatever your default browser is. It works; it just looks like a tab.
'
'  RU: ЧТО ЭТО ДЕЛАЕТ И ПОЧЕМУ ЭТО СКРИПТ
'
'      Калькулятор - это веб-страница, но он не должен ОЩУЩАТЬСЯ страницей:
'      никакой адресной строки, вкладок, чёрного окна консоли и установки.
'      Поэтому скрипт находит уже установленный браузер на Chromium (Edge есть
'      на любой Windows 11) и запускает его в "режиме приложения" - открывается
'      обычное окно, в котором нет ничего, кроме самой программы.
'
'      Это .vbs, а не .bat, потому что wscript.exe запускается вообще без
'      мелькающего чёрного окна консоли.
'
'      Браузер получает собственную маленькую папку профиля в
'      %LOCALAPPDATA%\Vic3Calculator, чтобы:
'        - окно всегда было отдельным окном программы, а не вкладкой браузера,
'        - ваши сохранённые цепочки и настройки не смешивались с браузером,
'        - ничего здесь не мешало вашему обычному браузеру.
'
'      Если браузера на Chromium нет, страница откроется в браузере по
'      умолчанию. Работать будет, просто выглядеть как вкладка.
' ============================================================================
Option Explicit

Dim fso, sh, env
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
Set env = sh.Environment("PROCESS")

' --- Where are we, and where is the page? -----------------------------------
Dim appDir, pageFile, pageUrl
appDir   = fso.GetParentFolderName(WScript.ScriptFullName)
pageFile = fso.BuildPath(appDir, "app\index.html")

If Not fso.FileExists(pageFile) Then
    MsgBox "Cannot find:" & vbCrLf & pageFile & vbCrLf & vbCrLf & _
           "Keep this script in the same folder as the 'app' directory." & vbCrLf & vbCrLf & _
           "Не найден файл:" & vbCrLf & pageFile & vbCrLf & vbCrLf & _
           "Держите этот скрипт в той же папке, что и каталог 'app'.", _
           vbCritical, "Vic3 Calculator"
    WScript.Quit 1
End If

' The path has to be percent-encoded, not just slash-flipped.
' Edge silently refuses to open a file:// URL that contains raw non-ASCII
' characters - it starts, creates its profile, and exits without a window. A
' Windows user called "Администратор" (or any accented name, or a folder with a
' space) hits this. Encoding to UTF-8 %XX fixes it and is harmless for plain
' ASCII paths.
pageUrl = "file:///" & UrlEncodePath(Replace(pageFile, "\", "/"))

' --- A private browser profile, kept out of the app folder ------------------
Dim profileDir
profileDir = fso.BuildPath(env("LOCALAPPDATA"), "Vic3Calculator\browser")
EnsureFolder profileDir

' --- Find a Chromium-based browser ------------------------------------------
Dim candidates, i, browser
candidates = Array( _
    env("ProgramFiles(x86)") & "\Microsoft\Edge\Application\msedge.exe", _
    env("ProgramFiles")      & "\Microsoft\Edge\Application\msedge.exe", _
    env("ProgramFiles")      & "\Google\Chrome\Application\chrome.exe", _
    env("ProgramFiles(x86)") & "\Google\Chrome\Application\chrome.exe", _
    env("LOCALAPPDATA")      & "\Google\Chrome\Application\chrome.exe", _
    env("ProgramFiles")      & "\BraveSoftware\Brave-Browser\Application\brave.exe", _
    env("ProgramFiles")      & "\Vivaldi\Application\vivaldi.exe" _
)

browser = ""
For i = 0 To UBound(candidates)
    If Len(candidates(i)) > 0 Then
        If fso.FileExists(candidates(i)) Then
            browser = candidates(i)
            Exit For
        End If
    End If
Next

' --- Launch -----------------------------------------------------------------
Dim cmd
If browser <> "" Then
    ' --app        : a window with no browser interface at all
    ' --user-data-dir : our own profile, so this is always its own window
    ' --no-first-run / --no-default-browser-check : never interrupt the user
    cmd = """" & browser & """" & _
          " --app=""" & pageUrl & """" & _
          " --user-data-dir=""" & profileDir & """" & _
          " --window-size=1600,950" & _
          " --no-first-run --no-default-browser-check --disable-features=Translate"
    sh.Run cmd, 1, False
Else
    ' No Chromium browser: open in whatever handles .html. Still works.
    sh.Run """" & pageFile & """", 1, False
End If

' ---------------------------------------------------------------------------
' Percent-encode a path for use inside a file:// URL.
' Characters that are safe in a URL path are kept as they are; everything else
' is converted to UTF-8 and written as %XX bytes.
' ---------------------------------------------------------------------------
Function UrlEncodePath(s)
    Dim i, ch, code, out, safe
    safe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~/:"
    out = ""
    i = 1
    Do While i <= Len(s)
        ch = Mid(s, i, 1)
        code = AscW(ch)
        If code < 0 Then code = code + 65536      ' AscW returns signed

        If InStr(safe, ch) > 0 And code < 128 Then
            out = out & ch
        ElseIf code < 128 Then
            out = out & Pct(code)
        ElseIf code < 2048 Then
            out = out & Pct(192 + (code \ 64)) & Pct(128 + (code Mod 64))
        ElseIf code >= 55296 And code <= 56319 And i < Len(s) Then
            ' Surrogate pair (rare in paths, but a folder name can contain one)
            Dim lo, cp
            lo = AscW(Mid(s, i + 1, 1))
            If lo < 0 Then lo = lo + 65536
            cp = 65536 + (code - 55296) * 1024 + (lo - 56320)
            out = out & Pct(240 + (cp \ 262144)) & _
                        Pct(128 + ((cp \ 4096) Mod 64)) & _
                        Pct(128 + ((cp \ 64) Mod 64)) & _
                        Pct(128 + (cp Mod 64))
            i = i + 1
        Else
            out = out & Pct(224 + (code \ 4096)) & _
                        Pct(128 + ((code \ 64) Mod 64)) & _
                        Pct(128 + (code Mod 64))
        End If
        i = i + 1
    Loop
    UrlEncodePath = out
End Function

Function Pct(b)
    Pct = "%" & Right("0" & Hex(b), 2)
End Function

' ---------------------------------------------------------------------------
Sub EnsureFolder(path)
    Dim parent
    If fso.FolderExists(path) Then Exit Sub
    parent = fso.GetParentFolderName(path)
    If Len(parent) > 0 And Not fso.FolderExists(parent) Then EnsureFolder parent
    On Error Resume Next
    fso.CreateFolder path
    On Error GoTo 0
End Sub
