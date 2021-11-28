/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import Logger from 'f5-conx-core/dist/logger';


/**
 * the whole point of this logger file is to instantiate a unique logger instance and return the singleton instance for the rest of the extension
 * 
 * This allows for another unique instance to be used for other extensions
 * 
 * https://stackoverflow.com/questions/30174078/how-to-define-singleton-in-typescript
 * 
 * 
 */

export const logger = new Logger('F5_VSCODE_LOG_LEVEL');
// export const logger = loggerInst;
