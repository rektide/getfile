# Fetch File

**Fetch File** is intended for conditional fetch of a file from a server onto the filesystem, making use of modern cache control techniques in a seamless and invisible fashion.

At the time of download, Fetch File stores pertinent cache control information into extended attributes. When called to fetch a file, Fetch File reads these attributes to determine whether the content is expired and needs updating or not.

## Extended Attributes

* `expires` is populated by either a `cache-control: max-age` or `expires` tag from the server, and designates a period that the content is good until.
* `download-date` is sent as an `If-Modified-Since` header to the server.
* `etag` is sent as an `If-None-Match` header to the server.
