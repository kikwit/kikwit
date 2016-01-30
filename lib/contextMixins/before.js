'use strict';

import * as results from '../actionResults';

export default {

	skipToAction() {
		this.result = new results.SkipToActionResult()
		this.resolve();
	}
}
