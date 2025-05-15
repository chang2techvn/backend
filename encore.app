{
	"id":   "backend-xbk2",
	"lang": "typescript",
	"sqldb": {
		"task-mgmt-db": {
			"migrations": "./prisma/migrations"
		}
	},
	"build": {
		"cgo_enabled": false,
		"docker": {
			"base_image": "node:20-alpine",
			"bundle_source": true,
			"working_dir": "/workspace"
		}
	}
}
