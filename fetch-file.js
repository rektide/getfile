var 
  Promise= require('bluebird'),
  request = require('request'),
  xattr= require('xattr-async')

xattr= Promise.promisifyAll(xattr)

var okCodes = [200, 201];

['get', 'del', 'put', 'post', 'put', 'patch'].forEach(function(slot){
	var fn= function(options, cb){
		if(options.filename === undefined){
			throw 'Expected a local filename'
		}

		// look for existing
		return Promise.settle([
		    fs.lstatAsync(options.filename),
		    xattr.getAsync(options.filename, 'download-date'),
		    xattr.getAsync(options.filename, 'etag')
		  ])
		  .then(function(stats){
			// set headers
			var headers= options.headers,
			  time= stats[1].isFulfilled() ? stats[1].value() : (stats[0].isFulfilled() ? stats[0].value().mtime : null)
			if(stats[2].isFulfilled() && !headers['If-None-Match'])
				headers['If-None-Match']= stats[2].value()
			if(time && !headers['If-Modified-Since'])
				headers['If-Modified-Since']= time.toUTCString()
			if(options.gzip !== false)
				options.gzip= true
	
			var defer = Promise.defer()
			defer.promise.request= request.get(options, function(err, response, body){
				if (!error && options.writeFile !== false && ~okCodes.indexOf(response.statusCode)){
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
							expires= new Date()
							expires.setSeconds(parseInt(v))
						}
					}

					var xattrs= []
					if(expires && expires != -1)
						xattrs.push(xattr.setAsync(filename, 'expires', expires.toUTCString()))
					if(headers.etag)
						xattrs.push(xattr.setAsync(filename, 'etag', headers.etag))
					xattrs.push(xattr.setAsync(filename, 'download-date', new Date().toUTCString()))

					var all= Promise.all(xattrs)
					defer.resolve(all)
					if(cb)
						all.then(function(){
							cb(null, response, body)
						}, function(err){
							cb(err, response, body)
						})
				}else if(cb)
					cb(err, response, body)
			})
			if(options.writeFile !== false)
				defer.promise.request.pipe(fs.createWriteStream(filename), {encoding: options.encoding})
			return defer.promise
		  })
	}
	if(slot == 'get')
		module.exports= fn
	module.exports[slot]= fn
})
