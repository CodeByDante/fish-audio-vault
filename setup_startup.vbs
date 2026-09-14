Set WshShell = CreateObject("WScript.Shell")
strStartup = WshShell.SpecialFolders("Startup")
Set oShortcut = WshShell.CreateShortcut(strStartup & "\FishAudioSync.lnk")
oShortcut.TargetPath = WshShell.CurrentDirectory & "\Iniciar_Servidor.bat"
oShortcut.WorkingDirectory = WshShell.CurrentDirectory
oShortcut.WindowStyle = 7
oShortcut.Save
