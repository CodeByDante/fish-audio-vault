Set WshShell = CreateObject("WScript.Shell")
strStartup = WshShell.SpecialFolders("Startup")
strDesktop = WshShell.SpecialFolders("Desktop")
strDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
strVbsPath = strDir & "\Iniciar_SegundoPlano.vbs"

' 1. Crear acceso directo en la carpeta de Inicio de Windows (Auto-arranque)
Set oStartupShortcut = WshShell.CreateShortcut(strStartup & "\FishAudioSync.lnk")
oStartupShortcut.TargetPath = "wscript.exe"
oStartupShortcut.Arguments = """" & strVbsPath & """"
oStartupShortcut.WorkingDirectory = strDir
oStartupShortcut.WindowStyle = 7
oStartupShortcut.Save

' 2. Crear acceso directo en el Escritorio con el icono de la aplicación
Set oDesktopShortcut = WshShell.CreateShortcut(strDesktop & "\Fish Audio Voice Vault.lnk")
oDesktopShortcut.TargetPath = "wscript.exe"
oDesktopShortcut.Arguments = """" & strVbsPath & """"
oDesktopShortcut.WorkingDirectory = strDir
If CreateObject("Scripting.FileSystemObject").FileExists(strDir & "\images\icon128.png") Then
    oDesktopShortcut.IconLocation = strDir & "\images\icon128.png, 0"
End If
oDesktopShortcut.Save
