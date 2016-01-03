'use strict';

import * as results from '../actionResults';

export default {

	next() {
		this.result = null;
		this.resolve();
	}
}
