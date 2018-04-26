#!/usr/bin/env node
const express = require('express')
const mcache = require('memory-cache')
const thepiratebay = require('thepiratebay')

const app = express()

const port = process.env.PORT || 17873

const requestCache = (duration) => {
	return (req, res, next) => {
		let key = `__express__${req.originalUrl}` || req.url
		let cachedBody = mcache.get(key)
		if (cachedBody) {
			res.send(cachedBody)
		} else {
			res.sendResponse = res.send
			res.send = (body) => {
				mcache.put(key, body, duration)
				res.sendResponse(body)
			}
			next()
		}
	}
}

app.get('/', (req, res) => {
	res.type('text/plain').send('thepiratebay-search-api v1.0.0')
})

app.get('/search', requestCache(60 * 60 * 6), (req, res) => {
	function done (response) {
		if (!response) {
			res.send({ success: false, error: `Cannot fetch results!` })
			return
		}
		res.send({ success: true, data: response })
	}
	
	thepiratebay.search(req.query.q, {
		category: 'all',
		filter: {
			verified: req.query.vip ? true : false
		},
		page: req.query.page,
		orderBy: req.query.order == 'leeches' ? 'leeches' : 'seeds',
		sortBy: 'desc'
	}).then(function (data) {
		done (data)
	}).catch(function (err) {
		done (false)
	})
})

app.listen(port)
console.log(`Listening on: ${port}`)