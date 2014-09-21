# Fetch File

**Fetch File** is intended for conditional fetch of a file from a server onto the filesystem, making use of modern cache control techniques in a seamless and invisible fashion.

At the time of download, Fetch File stores pertinent cache control information into extended attributes. When called to fetch a file, Fetch File reads these attributes to determine whether the content is expired and needs updating or not.

## API

As per request module. Additional options:

* `filename` specifies the local filename to be read from & written into. Will use basename of url if not specified.
* `silent` for when no actual content needs be returned to the program (just write the file).
* `mustRevalidate` insures content is checked for freshness.
* `noMtime` prevents use of modification time as a fallback for `download-date`.
* `writeFile` prevents the file from being re-written.

## Example

```
// download robots.txt if not updated
require('fetch-file')('https://yoyodyne.net/robots.txt')
// efficiently download robots.txt if not updated
require('fetch-file')({url: 'https://yoyodyne.net/robots.txt', silent: true})
// download robots.txt and blab about it
require('fetch-file')('https://yoyodyne.net/robots.txt', function(err, response, body){
	if(err) console.error('something went wrong gettings robots.txt')
	else if(!response) console.info('robots were here and weren't expired')
	else console.info('we fetched robots, size:', body.length)
})
```

## Extended Attributes

* `expires` is populated by either a `cache-control: max-age` or `expires` tag from the server, and designates a period that the content is good until.
* `download-date` is sent as an `If-Modified-Since` header to the server.
* `etag` is sent as an `If-None-Match` header to the server.
