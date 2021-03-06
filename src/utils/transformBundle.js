import { decode } from 'sourcemap-codec';
import error from './error.js';

export default function transformBundle ( code, plugins, sourcemapChain, options ) {
	return plugins.reduce( ( promise, plugin ) => {
		if ( !plugin.transformBundle ) return promise;

		return promise.then( code => {
			return Promise.resolve().then( () => {
				return plugin.transformBundle( code, { format : options.format } );
			}).then( result => {
				if ( result == null ) return code;

				if ( typeof result === 'string' ) {
					result = {
						code: result,
						map: null
					};
				}

				const map = typeof result.map === 'string' ? JSON.parse( result.map ) : result.map;
				if ( map && typeof map.mappings === 'string' ) {
					map.mappings = decode( map.mappings );
				}

				sourcemapChain.push( map );

				return result.code;
			}).catch( err => {
				error({
					code: 'BAD_BUNDLE_TRANSFORMER',
					message: `Error transforming bundle${plugin.name ? ` with '${plugin.name}' plugin` : ''}: ${err.message}`,
					plugin: plugin.name
				});
			});
		});

	}, Promise.resolve( code ) );
}
