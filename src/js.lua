-- Make window object a global
window = js.global;

do -- Create js.ipairs and js.pairs functions. attach as __pairs and __ipairs on JS userdata objects.
	local _PROXY_MT = debug.getregistry()._PROXY_MT

	-- Iterates from 0 to collection.length-1
	local function js_inext(collection, i)
		i = i + 1
		if i >= collection.length then return nil end
		return i, collection[i]
	end
	function js.ipairs(collection)
		return js_inext, collection, -1
	end
	_PROXY_MT.__ipairs = js.ipairs

	function js.pairs(ob)
		local keys = js.global.Object:getOwnPropertyNames(ob) -- Should this be Object.keys?
		local i = 0
		return function(ob, last)
			local k = keys[i]
			i = i + 1;
			return k, ob[k]
		end, ob, nil
	end
	_PROXY_MT.__pairs = js.pairs
end

-- Set up require paths to be sensible for the browser
local function load_lua_over_http(url)
	local xhr = js.new(window.XMLHttpRequest)
	xhr:open("GET", url, false) -- Synchronous
	-- Need to pcall xhr:send(), as it can throw a NetworkError if CORS fails
	local ok, err = pcall(xhr.send, xhr)
	if not ok then
		return nil, tostring(err)
	elseif xhr.status ~= 200 then
		return nil, "HTTP GET " .. xhr.statusText .. ": " .. url
	end
	return load(xhr.responseText, url)
end
package.path = ""
package.cpath = ""
table.insert(package.searchers, function (mod_name)
	if not mod_name:match("/") then
		local full_url = mod_name:gsub("%.", "/") .. ".lua"
		local func, err = load_lua_over_http(full_url)
		if func ~= nil then return func end

		local full_url = mod_name:gsub("%.", "/") .. "/init.lua"
		local func, err2 = load_lua_over_http(full_url)
		if func ~= nil then return func end

		return "\n    " .. err .. "\n    " .. err2
	end
end)
table.insert(package.searchers, function (mod_name)
	if mod_name:match("^https?://") then
		local func, err = load_lua_over_http(mod_name)
		if func == nil then return "\n    " .. err end
		return func
	end
end)
