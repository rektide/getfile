# Fetch File

*Fetch File* is intended for conditional fetch of a file from a server onto the filesystem, making use of modern cache control techniques seamless and invisible for downloading a file.

At the time of download, Fetch Files stores `etag` `download-date` and `expired` (populated by max-age, falling back to the actualy expiry tag) data it gets from the server into the file as an extended attribute (xattr). If called with an existing file in place, Fetch File will use any of these attributes that it finds (as well as using the file`s modification date as fallback to `download-date` for the `If-Modified-Since` header) to either prevent the request from going out entirely (if the content is not yet `expired`) or as `If-Modified-Since` and `If-None-Match` (using `download-date` and `etags`) headers which can potentially return a `304 Not Modified`.
