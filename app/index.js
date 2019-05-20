import { html, render } from "lit-html"
import np from "./node-process.js"
import "./index.css"

const values = {
	dblclk: "copy",
	command: "start $0",
	location: "",
	location_editing: false,
	location_tmp: "",
	selected: null,
	root_files: [],
	history: [],
	history_ptr: -1,
}

const tpl = () => html`
	<div class="location-bar">
		<i class="material-icons" @click=${onClickBack} ?disabled=${values.history_ptr === 0}>arrow_back</i>
		<i class="material-icons" @click=${onClickForward} ?disabled=${values.history_ptr === values.history.length - 1}
			>arrow_forward</i
		>
		<i class="material-icons" @click=${onClickUpward} ?disabled=${values.location.endsWith(np.sep)}>arrow_upward</i>
		<div class="border" @click=${onClickLocation}>
			<input
				class="location"
				.value=${values.location_tmp}
				@blur=${onBlurLocationInput}
				@keydown=${onKeydownLocationInput}
				@input=${onInputLocationInput}
				.hidden=${!values.location_editing}
			/>
			<div class="path" .hidden=${values.location_editing}>
				${pathTpl()}
			</div>
		</div>
		<i class="material-icons" @click=${onClickRefresh}>refresh</i>
	</div>
	<div class="tree-view files">
		<div class="files">
			<ul>
				${values.root_files.map(entriesTpl)}
			</ul>
		</div>
	</div>
	<div class="command-panel" @input=${onInputCommandPanel}>
		<div class="dblclk">
			<span>ファイルのダブルクリックの処理：</span>
			<select name="dblclk" .value=${values.dblclk}>
				<option value="copy">パスのコピー</option>
				<option value="start">start で開く</option>
				<option value="command">コマンドの実行</option>
			</select>
		</div>
		<div class="command">
			<span>コマンド：</span>
			<input name="command" type="text" .value=${values.command} />
			<button @click=${onClickRun}>実行</button>
		</div>
		<div class="desc">
			$0 が選択中のファイルのパスになります
		</div>
	</div>
`

const entriesTpl = entry => html`
	<li>
		<div
			class="row ${values.selected === entry.path ? "selected" : ""}"
			title=${entry.path}
			data-type=${entry.type}
			@click=${onClickRow}
			@dblclick=${onDoubleClickRow}
			.data=${entry}
		>
			<div class="col name">
				<i class="material-icons">${entry.type === "file" ? "note" : entry.open ? "folder_open" : "folder"}</i>
				<span>${entry.name}</span>
			</div>
			<div class="col ts">
				${entry.ts.toLocaleString()}
			</div>
			<div class="col size">
				${entry.size.toLocaleString()} bytes
			</div>
		</div>
		<div class="files" .hidden=${!entry.files || !entry.files.length || !entry.open}>
			<ul>
				${entry.files && entry.files.map(entriesTpl)}
			</ul>
		</div>
	</li>
`

const pathTpl = () => {
	const norm_path = values.location.endsWith(np.sep) ? values.location.slice(0, -1) : values.location
	const parts = norm_path.split(np.sep)
	return parts
		.map(
			(e, i) => html`
				<span class="part" data-path=${parts.slice(0, i + 1).join(np.sep)}>${e}</span>
			`
		)
		.reduce(
			(a, b) => [
				...a,
				html`
					<span class="splitter"></span>
				`,
				b,
			],
			[]
		)
		.slice(1)
}

const onClickRow = eve => {
	const d = eve.currentTarget.data
	if (d.type === "folder" && eve.target.closest(".col.name i")) {
		d.open = !d.open
		if (d.open) {
			const path = np.resolvePath(d.path)
			d.files = np.getEntries(path)
		}
	} else {
		values.selected = d.path
	}
	update()
}

const onDoubleClickRow = eve => {
	const d = eve.currentTarget.data
	if (d.type === "folder") {
		navigate(d.path)
		update()
	} else {
		switch (values.dblclk) {
			case "copy":
				copyClipboard(values.selected)
				alert("パスをコピーしました")
				break
			case "start":
				runCommand(`start ${values.selected}`)
				break
			case "command":
				runCommand()
				break
		}
	}
}

const onClickBack = eve => {
	if (values.history_ptr === 0) return
	values.history_ptr -= 1
	historyMove()
	update()
}

const onClickForward = eve => {
	if (values.history_ptr === values.history.length - 1) return
	values.history_ptr += 1
	historyMove()
	update()
}

const onClickUpward = eve => {
	if (values.location.endsWith(np.sep)) return
	const parent = values.location
		.split(np.sep)
		.slice(0, -1)
		.join(np.sep)
	navigate(parent)
	update()
}

const onClickLocation = eve => {
	if (eve.target.closest(".part")) {
		navigate(eve.target.closest(".part").dataset.path)
		update()
	} else {
		values.location_editing = true
		values.location_tmp = values.location
		update()
		document.querySelector(".location").focus()
	}
}

const onKeydownLocationInput = eve => {
	if (eve.keyCode === 13) {
		navigate(values.location_tmp)
		update()
	} else if (eve.keyCode === 27) {
		values.location_editing = false
		update()
	}
}

const onBlurLocationInput = eve => {
	values.location_editing = false
	update()
}

const onClickRefresh = eve => {
	historyMove()
	update()
}

const onClickRun = eve => {
	if (!values.command) return
	runCommand()
	update()
}

const onInputCommandPanel = eve => {
	if (!eve.target.name) return
	values[eve.target.name] = eve.target.value
	update()
}

const onInputLocationInput = eve => {
	values.location_tmp = eve.target.value
	update()
}

const navigate = path => {
	path = np.resolvePath(path)
	let entries
	try {
		entries = np.getEntries(path)
		if (!entries) {
			alert(`フォルダ "${path}" が見つかりません`)
			return
		}
	} catch (err) {
		alert(`フォルダ "${path}" を開けません`)
		return
	}
	values.location = path
	values.location_editing = false
	values.root_files = entries
	values.history.length = ++values.history_ptr
	values.history.push(path)
}

const historyMove = () => {
	const path = values.history[values.history_ptr]
	let entries
	try {
		entries = np.getEntries(path)
		if (!entries) {
			alert(`フォルダ "${path}" が見つかりません。移動・削除された可能性があります`)
			return
		}
	} catch (err) {
		alert(`フォルダ "${path}" を開けません`)
		return
	}
	values.location = path
	values.location_editing = false
	values.root_files = entries || []
}

const copyClipboard = text => {
	const ta = document.createElement("textarea")
	ta.value = text
	document.body.append(ta)
	ta.focus()
	ta.select()
	document.execCommand("copy")
	ta.remove()
}

const runCommand = async command => {
	if (!command) {
		command = values.command.replace(/\$0/g, values.selected)
	}
	const result = await np.run(command)
	alert(
		[
			`command: ${command}`,
			`exit code: ${result.code}`,
			`[stdout]:\n${result.stdout}`,
			`[stderr]:\n${result.stderr}`,
		].join("\n")
	)
}

const container = document.querySelector(".container")
const update = () => render(tpl(), container)
const init = () => {
	navigate("/")
	update()
}

init()
