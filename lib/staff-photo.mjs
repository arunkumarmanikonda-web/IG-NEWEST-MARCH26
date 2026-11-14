export function staffPhoto(path) {
 const library = /^\/images\/library\/([a-f0-9-]{36})\.jpg$/.exec(path || '');
 return library ? '/api/admin/source-media/' + library[1] : path;
}
