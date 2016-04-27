
'use strict';

import assert from 'assert';

export const customMatchers = ({

    toDeepEqual() {

        return {
            
            compare(actual, expected) {

                let pass = true;
                
                try {
                    assert.deepEqual(actual, expected);
                } catch (e) {
                    pass = false;
                }
                
                const result = { pass };
                
                if (!result.pass) {
                    result.message = 'The two objects are not deep-equal.';
                }
                
                return result;
            }
        }
    }
});
