const { app, BrowserWindow } = require("electron")

let main_window = null

app.on("ready", () => {
	main_window = new BrowserWindow()
	main_window.loadFile("index.html")
	main_window.on("closed", () => {
		main_window = null
		app.quit()
	})
})
