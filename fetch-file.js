'use strict';

var 
  Promise= require('bluebird'),
  request= require('request'),
  aggregate= require('stream-aggregate'),
  xattr= require('xattr-async')

xattr= Promise.promisifyAll(xattr)

var okCodes = [200, 201, 304];

['get', 'del', 'put', 'post', 'put', 'patch'].forEach(function(slot){
	var fn= function(options, cb){
		options.method= options.method|| slot
		if(!options.filename)
			options.writeFile= false

		// look for existing
		return Promise.settle([
		    fs.lstatAsync(options.filename),
		    xattr.getAsync(options.filename, 'download-date'),
		    xattr.getAsync(options.filename, 'etag'),
		    xattr.getAsync(options.filename, 'expires')
		  ])
		  .then(function(stats){
			if(stats[3] && !options.mustRevalidate && new Date(stats[3]) > new Date()){
				// unexpired content
				if(options.silent)
					// shortcut out
					return
				// create accessors somewhat as per 'request'
				var reader= fs.createReadStream(filename, {encoding: options.encoding})
				if(cb){
					aggregate(reader, function(err, body){
						cb(err, null, body)
					})
				}
				return reader
			}

			// set headers
			var headers= options.headers
			// if modified since 
			var time= stats[1].isFulfilled() ? stats[1].value() : null
			if(time == null && !options.dontCheckMtime && stats[0].isFulfilled())
				time= stats[0].value().mtime
			if(time && !headers['If-Modified-Since'])
				headers['If-Modified-Since']= time.toUTCString()
			// if-none-match
			if(stats[2].isFulfilled() && !headers['If-None-Match'])
				headers['If-None-Match']= stats[2].value()
			// gzip by default
			if(options.gzip !== false)
				options.gzip= true

			// go
			return request.get(options, function(err, response, body){
				if (!error && ~okCodes.indexOf(response.statusCode)){

					// read header data
					var headers= response.headers,
					  cc= headers['cache-control'].split(','),
					  expires= headers.expires
					if(expires)
						expires= new Date(expires)
					for(var i in cc){
						var d= cc[i].split('='),
						  k= d[0],
						  v= d[1]
						k.trim()
						if(k == 'no-cache' || k == 'must-revalidate')
							expires= -1
						else if(k == 'max-age' && /\d+/.test(v) && expires != -1){
							// stomp any 'expires' header
							expires= new Date()
							expires.setSeconds(parseInt(v))
						}
					}

					// write file
					var all
					if (options.writeFile !== false){
						// write file content
						var write= fs.writeFileAsync(filename, {encoding: options.encoding}, body)
						// write xattr
						all= write.then(function(){
							var settles= [response, body, write]
							if(expires && expires != -1)
								settles.push(xattr.setAsync(filename, 'expires', expires.toUTCString()))
							if(headers.etag)
								settles.push(xattr.setAsync(filename, 'etag', headers.etag))
							settles.push(xattr.setAsync(filename, 'download-date', new Date().toUTCString()))
							return Promise.all(settles)
						}).then(function(settles){
							cb(null, response, body)
						}, function(err){
							cb(err, response, body)
						})

					}else{
						if(!options.silent && cb){
							cb(null, response, body)
						}	
					}
				}
			})
		  })
	}
	if(slot == 'get')
		module.exports= fn
	module.exports[slot]= fn
})
