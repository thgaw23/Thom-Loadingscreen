fx_version 'cerulean'
game 'gta5'
author 'Thom'

loadscreen_manual_shutdown "yes"

loadscreen 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/config.js',
    'html/assets/*.*',
    'html/backgrounds/*.*',
}

loadscreen_cursor 'yes'

client_scripts {
	'client.lua'
}

