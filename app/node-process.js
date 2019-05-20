// nodejs の require にするために window. 必要
const fs = window.require("fs")
const p = window.require("path")
const cp = window.require("child_process")
const process = window.require("process")

module.exports = new (class {
	resolvePath(path) {
		if (process.platform === "win32" && path.match(/^[A-Z]:$/)) {
			return path + p.sep
		}
		return p.resolve(path)
	}

	get sep(){
		return p.sep
	}

	getEntries(path) {
		if (!fs.existsSync(path)) return null
		if (!fs.statSync(path).isDirectory()) return null
		const names = fs.readdirSync(path)
		const entries = names.map(e => {
			const fullpath = p.join(path, e)
			try {
				const stat = fs.statSync(fullpath)
				const type = stat.isDirectory() ? "folder" : stat.isFile() ? "file" : null
				return {
					type,
					name: e,
					path: fullpath,
					size: stat.size,
					ts: stat.mtime,
					files: type === "folder" ? [] : null,
				}
			} catch (err) {
				// EBUSY: resource busy or locked, stat 'C:\hiberfil.sys' などの対策
				return { type: "error" }
			}
		})
		const sortByName = (a, b) => a.name.localeCompare(b.name)
		return [
			...entries.filter(e => e.type === "folder").sort(sortByName),
			...entries.filter(e => e.type === "file").sort(sortByName),
		]
	}

	run(command) {
		return new Promise(r => {
			cp.exec(command, (err, stdout, stderr) => {
				r({
					code: err ? err.code : 0,
					stdout,
					stderr,
				})
			})
		})
	}
})()
