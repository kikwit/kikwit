'use strict';

// TODO Remove /index.js
import * as results from '../actionResults/index.js';

export default {

	error(err) {
		
		this.result = null;
		this.reject(err);
	}
}
