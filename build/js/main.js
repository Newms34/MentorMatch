const socket = io(),
    app = angular.module('codementormatch-app', ['ui.router', 'ngAnimate', 'ngSanitize', 'ngMaterial', 'ngMessages']),
    resetApp = angular.module('reset-app', []);

const defaultPic = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAACNCAIAAAAPTALlAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAANsSURBVHhe7dVRduIwEETR7GkWmK1HhMch9giw1dWyZNf9mZwM2F3vJ1//TM1N9dxUz0313FTPTfVGb/r9Fh8azIhNCbYTXx7AWE3JE8CDDjVEU3pI8egjHN+UBgl4QXdHNmV6Ml7W0WFNWdwFr+zlgKYM7Y7X5+vdlH0H4YhkXZuy7FCckqlfUzYNgIPSdGrKmmFwVo6LNi24LEGPpowYDMclSG/KgiFxotqlmxZcKZXblMMHxqFSiU25enicq+OmN1wsktWUYyfB0SJuesPRIilNuXQqnK7gpuB0BX1TbpwQA8Lc9IkBYW66wIYYcVNOmxYzYtx0gRkxbrrAjBhlU+6aHGMC3HSNMQFuusaYADddY0yAm64xJsBNK9jTStaUc06BSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrWRNCy6aH3tauekaYwLcdI0xAW66xpgAN11jTICbrjEmQNm04K5pMSPGTReYEeOmC8yIcdMFZsSImxZcNyEGhLnpEwPC9E0LbpwKpyu4KThdIaVpwaWT4GgRN73haBE3veFokaymBfcOj3N1EpsWXD0wDpVyU73cpgW3D4kT1dKbFiwYDMcl6NG0YMdIuCzBRZtyVo5OTQvWDICD0vRrWrDpUJySqWvTgmUH4YhkvZsW7OuO1+e7SlPe3cXl/kZxTaZOTRk0Bm5Kk96UHePhvgS5TTl/YBwqldWUk2fAxTopTTl2HtwtIm7KjXNiQ5iyKafNjCUxsqYcNT/2BGiacs5ZsKqVoCmHnAvbmkSbcsIZsXC/UFNefl7s3Km9Ka89O9bu0diUF14DmzdracqrroTl27jpJizfZndTXnI97N9gX1Mef1VU+GRHUx58bbR4y033ocVbW5vySNuQdVNTHmYPdHnBTVvQ5YXPTXmMLVGnxk0bUafmQ1MeYDU0+s+7pnzVXqPUkpuGUGrpZVO+ZJ/Q6w83jaLXH24qQLKHelM+a9tQ7cFNBaj2UGnKB20P2v1yUw3a/Vo35SO2HwXdVIiCbipEwVVT/tNa3TO6qdI9o5sq3TO6qVjJ+GzK7yymlHRTsVLSTcVKSZryC1NwUz031XNTPTfVuzXlRxNxUz031XNTPTfVc1M9N9VzU70v/jWV7+8ffZYE08zo+Y8AAAAASUVORK5CYII=';

Array.prototype.findUser = function (u) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].user == u) {
            return i;
        }
    }
    return -1;
};
let hadDirect = false;
const dcRedirect = ['$location', '$q', '$injector', function ($location, $q, $injector, $http) {
    //if we get a 401 response, redirect to login
    let currLoc = '';
    return {
        request: function (config) {
            // $log.debug('STATE', $injector.get('$state'));
            currLoc = $location.path();
            return config;
        },
        requestError: function (rejection) {
            return $q.reject(rejection);
        },
        response: function (result) {
            return result;
        },
        responseError: function (response) {
            $log.debug('Something bad happened!', response, currLoc, $location.path());
            hadDirect = true;
            bulmabox.alert(`App Restarting`, `Hi! I've made some sort of change just now to make this app more awesome! Unfortunately, this also means I've needed to restart it. I'm gonna log you out now.`, function (r) {
                fetch('/user/logout')
                    .then(r => {
                        hadDirect = false;
                        $state.go('appSimp.login', {}, {
                            reload: true
                        });
                        return $q.reject(response);
                    });
            });
        }
    };
}];
app
    .constant('IsDevelopment', window.location.hostname === 'localhost')
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', '$compileProvider', '$logProvider','IsDevelopment','$mdGestureProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $compileProvider, $logProvider, IsDevelopment,$mdGestureProvider) {
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/404');
        $mdGestureProvider.skipClickHijack();
        $compileProvider.debugInfoEnabled(IsDevelopment);
        $logProvider.debugEnabled(IsDevelopment);
        if(IsDevelopment) console.log('-------------------------\nDebug mode enabled \n-------------------------');
        $stateProvider
            //the states
            //NORMAL states (auth'd)
            .state('app', {
                abstract: true,
                templateUrl: 'layouts/full.html'
            })
            .state('app.dash', {
                url: '/', //default route, if not 404
                templateUrl: 'components/dash.html'
            })
            .state('app.mentor', {
                url: '/mentor',
                templateUrl: 'components/mentor.html'
            })
            .state('app.mod', {
                url: '/mod',
                templateUrl: 'components/mod.html'
            })
            .state('app.help', {
                url: '/help',
                templateUrl: 'components/help/help.html'
            })
            .state('app.match', {
                url: '/match',
                templateUrl: 'components/match.html'
            })
            .state('app.mail', {
                url: '/mail',
                templateUrl: 'components/mail.html'
            })
            .state('app.vote', {
                url: '/vote',
                templateUrl: 'components/voting.html'
            })
            //SIMPLE (unauth'd: login, register, forgot, 404, 500,reset)
            .state('appSimp', {
                abstract: true,
                templateUrl: 'components/layout/simp.html'
            })
            .state('appSimp.login', {
                url: '/login',
                templateUrl: 'components/login.html'
            })
            .state('appSimp.register', {
                url: '/register',
                templateUrl: 'components/register.html'
            })
            //and finally, the error-handling routes!
            .state('appSimp.notfound', {
                url: '/404',
                templateUrl: 'components/alt/404.html'
            })
            .state('appSimp.err', {
                url: '/500',
                templateUrl: 'components/alt/500.html'
            });

        //provider stuff

        $httpProvider.interceptors.push(function ($q) {
            return {
                // optional method
                'request': function (config) {
                    // do something on success
                    return config;
                },

                // optional method
                'requestError': function (rejection) {
                    return $q.reject(rejection);
                },



                // optional method
                'response': function (response, $http) {
                    // do something on success
                    // $log.debug('RESPONSE INTERCEPTOR', response && response.data)
                    if (response && response.data && response.data == 'refresh') {
                        // console.log('need to refresh',socket,socket.to)
                        socket.emit('requestRefresh',{id:socket.id})
                    }
                    return response;
                },

                // optional method
                'responseError': function (rejection) {
                    // do something on error
                    return $q.reject(rejection);
                }
            };
        });
    }])
    .directive("changeReFocus", [function () {
        return {
            restrict: 'EA',
            scope: {
                changeFn: "&"
            },
            link: function (scope, element, attributes) {
                // const theFn = scope.changeFn();
                // $log.debug('THE FUNCTION IS',scope.changeFn())
                element.bind("change", function (changeEvent) {
                    // $log.debug('SCOPE',scope,'ELEMENT',element,'ATTRIBS',attributes,scope.changeFn)
                    scope.changeFn().then(r => {
                        element[0].focus();
                    });
                    // scope.theFn('HELLOTHERE');
                });
            }
            // controller:function($scope, $element, $attrs,){
            //     $log.debug('SCOPE',$scope,'EL',$element)
            // }
        };
    }])
    //the following are for file uploading and markdown conversion. I don't THINK we'll need em, but... eh
    .directive("fileread", ['$log',function ($log) {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    const reader = new FileReader(),
                        theFile = changeEvent.target.files[0],
                        tempName = theFile.name;
                    $log.debug('UPLOADING FILE', theFile);
                    reader.onload = function (loadEvent) {
                        let theURI = loadEvent.target.result;
                        $log.debug('URI before optional resize', theURI, theURI.length);
                        if (scope.$parent.needsResize) {
                            //needs to resize img (usually for avatar)
                            resizeDataUrl(scope, theURI, scope.$parent.needsResize, scope.$parent.needsResize, tempName);
                        } else {
                            $log.debug('APPLYING file to $parent', scope.$parent);
                            scope.$apply(function () {
                                if (scope.$parent && scope.$parent.$parent && scope.$parent.$parent.avas) {

                                    scope.$parent.$parent.loadingFile = false;
                                    scope.$parent.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.$parent.fileread = theURI;
                                } else {
                                    scope.$parent.loadingFile = false;
                                    scope.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.fileread = theURI;
                                }
                                if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                                    scope.$parent.saveDataURI(dataURI);
                                }
                            });
                        }
                    };
                    if (!theFile) {
                        scope.$apply(function () {
                            scope.fileread = '';
                            scope.$parent.fileName = false;
                            scope.$parent.loadingFile = false;
                        });
                        return false;
                    }
                    if (theFile.size > 2500000) {
                        bulmabox.alert('File too Large', `Your file ${theFile.name} is larger than 2.5MB. Please upload a smaller file!`);
                        return false;
                    }
                    reader.readAsDataURL(theFile);
                });
            }
        };
    }])
    .directive("waitForData", [function () {
        return {
            restrict: 'A',
            // scope: {
            //     props: "="
            // },
            link: function (scope, element, attributes) {
                scope.wfdArr = attributes.waitForData.split(',').map(q => q.trim());
                const bgWait = document.createElement('div');
                bgWait.id = 'bg-wait';
                bgWait.innerHTML = 'Loading <div class="loady-spin"></div>';
                document.querySelector('body').append(bgWait);
                document.querySelector('#full-win').style.filter = "blur(9px)";
                let waiters = scope.wfdArr.map(function (q) {
                    // $log.debug('SCOPE HERE IS',scope)
                    const wfdIObj = {
                        fn: null,
                        name: q,
                        data: null
                    };
                    wfdIObj.fn = scope.$watch(q, function (nv, ov) {
                        wfdIObj.data = nv;
                        if (waiters.filter(a => !!a.data).length >= scope.wfdArr.length) {
                            waiters = [];//clear waiters so we're not polluting the scope;
                            document.querySelector('body').removeChild(document.querySelector('#bg-wait'));
                            document.querySelector('#full-win').style.filter = "none";
                        }
                    });
                    return wfdIObj;
                });
            }
        };
    }]);
    // .directive("simpleAutoSuggest", function ($sce) {
    //     return {
    //         restrict: "E",
    //         transclude: true,
    //         replace:true,
    //         scope: {
    //             items: '=simpleAutoItems',
    //             filterFn: '=simpleAutoFilter',
    //             output: '=simpleAutoOutput',
    //             adtnlClasses: '@simpleAutoClasses',
    //             adtnlStyles: '@simpleAutoStyles',
    //             nfText: '@simpleAutoNotFoundText',
    //             subItem: '@simpleAutoSubItem',
    //             verbose: '@simpleAutoVerbose'
    //         },
    //         template: `<div class='sas-cont {{adtnlClasses}}' style='{{adtnlStyles}}'>
    //         <input class='input sas-inp' type='text' ng-model='filterSearch' ng-keyup='doFilter()' />
    //         <div style='width:{{inpBoxDims.width}}px; min-height:100px;' ng-show='hasFocus && ((filteredItems && filteredItems.length)||showNFBox)' id='sas-suggestion-container'>
    //             <div ng-repeat='si in filteredItems' class='simple-auto-suggest-suggestion' ng-click='pickItem(si,$event);$event.stopPropagation();' ng-bind-html='hilite(si,subItem)'></div>
    //             <div ng-show='showNFBox'>
    //                 <ng-transclude>
    //                 </ng-transclude>
    //             </div>
    //         </div>
    //     </div>`,
    //         link: function (scope, element, attributes) {
    //             const vc = function () {
    //                 if (!scope.verbose) {
    //                     return false;
    //                 }
    //                 return console.log(...arguments);
    //             };
    //             vc("ATTRIBUTES", attributes, "ELEMENT", element, 'SCOPE', scope, 'ELEMENT HTML', element.html());
    //             scope.hasFocus = true;
    //             const inpBox = element[0].querySelector(".sas-inp");
    //             setTimeout(function () {
    //                 scope.inpBoxDims = element[0]
    //                     .querySelector(".sas-inp")
    //                     .getBoundingClientRect();
    //             }, 1);
    //             scope.notFoundEvald = () => {
    //                 return $sce.trustAsHtml(scope.nfText)
    //             }
    //             scope.showNFBox = false;
    //             scope.doFilter = () => {
    //                 console.log('SEARCHING FOR',scope.filterSearch, scope.filterFn,scope.filterOkay,scope.items)
    //                 const filterOkay =
    //                     scope.filterFn &&
    //                     typeof scope.filterFn === "function" &&
    //                     scope.items &&
    //                     (scope.items instanceof Array);
    //                 scope.filteredItems =
    //                     (scope.filterSearch &&
    //                         scope.filterSearch.length &&
    //                         filterOkay &&
    //                         scope.filterFn(scope.items, scope.filterSearch,scope.subItem||null)) ||
    //                     null;
    //                 vc(
    //                     "FILTERED STOOF", scope.filteredItems,
    //                     "SEARCH TERM",
    //                     scope.filterSearch,
    //                     'ALL ITEMS',
    //                     scope.items,
    //                     'Filter okay?', filterOkay
    //                 );
    //                 scope.showNFBox =
    //                     !!scope.filterSearch &&
    //                     (!scope.filteredItems || !scope.filteredItems.length);
    //                 // scope.$digest();
    //             }
    //             scope.pickItem = (it, me) => {
    //                 if (scope.output && scope.output !== 'null') {
    //                     //three different possibilities. First, if we're given a function, run dat function. Second, if it's an array, push into array. Thirdly, if neither, just replace
    //                     if (typeof scope.output === 'function') {
    //                         vc('output is fn!')
    //                         scope.output(it);
    //                     } else if (scope.output instanceof Array) {
    //                         vc('output is array')
    //                         scope.output.push(it);
    //                     } else {
    //                         scope.output = it;
    //                     }
    //                     vc('ITEM', it, me)
    //                     scope.filterSearch = it && me && me.srcElement && me.srcElement.innerText;
    //                 } else {
    //                     scope.filterSearch = it;
    //                 }
    //                 if(scope.subItem && scope.filterSearch[scope.subItem]){
    //                     scope.filterSearch = it[scope.subItem]
    //                 }
    //                 scope.filteredItems = [];
    //                 vc('PARENT NOW', scope.$parent, scope.output)
    //             };
    //             const climbAndSearchTree = (el, sel) => {
    //                 currEl = el,
    //                     elPath = [el],
    //                     selectorType = sel && sel[0] == '.' ? 'className' : sel && sel[0] == '#' ? 'id' : null;
    //                 let foundItem = false,
    //                     atTop = false;
    //                 if (sel && !selectorType) {
    //                     throw new Error('climbAndSearchTree only accepts simple className or id selectors for now!');
    //                 }
    //                 while (currEl && !foundItem && !atTop) {
    //                     currEl = currEl.parentNode;
    //                     console.log(currEl.tagName)
    //                     atTop = currEl && currEl.tagName && currEl.tagName.toLowerCase() === 'html';
    //                     elPath.push(currEl);
    //                     if ((selectorType == 'className' && currEl.className && currEl.className.toLowerCase().includes(sel.toLowerCase().slice(1)))
    //                         ||
    //                         (selectorType == 'id' && currEl.id && currEl.id.toLowerCase() == sel.toLowerCase().slice(1))) {
    //                         console.log('FOUND IT!')
    //                         //found the item;
    //                         foundItem = true;
    //                         break;
    //                     }
    //                 }
    //                 return foundItem || (!sel && elPath) || false;
    //             }
    //             vc('THIS SAS IS', element[0].querySelector('.sas-cont'))
    //             scope.hilite = t => {
    //                 const termString = scope.subItem && t[scope.subItem] ? t[scope.subItem] : typeof t !== 'string' ? JSON.stringify(t) : t,
    //                     pos = termString.indexOf(scope.filterSearch);
    //                 return $sce.trustAsHtml(
    //                     `${termString.slice(0, pos)}<strong>${scope.filterSearch}</strong>${termString.slice(
    //                         scope.filterSearch.length + pos
    //                     )}`
    //                 );
    //             };
    //             element[0].querySelector('.sas-inp').addEventListener(
    //                 "focus",
    //                 function (e) {
    //                     // vc('focus event', e,this)
    //                     scope.filterSearch = null;
    //                     scope.hasFocus = true;
    //                     scope.$digest();
    //                 },
    //                 false
    //             );
    //             element[0].querySelector('.sas-inp').addEventListener(
    //                 "blur",
    //                 function (e) {
    //                     setTimeout(function () {
    //                         vc('event', e, 'new Focus', document.elementFromPoint(scope.x, scope.y), climbAndSearchTree(document.elementFromPoint(scope.x, scope.y), '#sas-suggestion-container'))
    //                         if (!climbAndSearchTree(document.elementFromPoint(scope.x, scope.y), '#sas-suggestion-container')) {
    //                             // scope.hasFocus = false;
    //                             scope.hasFocus = false;
    //                             scope.$digest();
    //                         } else {
    //                             console.log('Clicked autosuggest item!')
    //                         }
    //                     }, 5);
    //                 },
    //                 false
    //             );
    //             element[0].addEventListener('mousemove', function simpMouse(e) {
    //                 // vc('MOUSE POS (client)',e.clientX,e.clientY)
    //                 scope.x = e.clientX;
    //                 scope.y = e.clientY;
    //             })
    //         }
    //     };
    // });

String.prototype.titleCase = function () {
    return this.split(/\s/).map(t => t.slice(0, 1).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
};

const resizeDataUrl = (scope, datas, wantedWidth, wantedHeight, tempName) => {
    // We create an image to receive the Data URI
    const img = document.createElement('img');

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
        // We create a canvas and get its context.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // We set the dimensions at the wanted size.
        canvas.width = wantedWidth;
        canvas.height = wantedHeight;

        // We resize the image with the canvas method drawImage();
        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

        const dataURI = canvas.toDataURL();
        scope.$apply(function () {
            scope.$parent.loadingFile = false;
            scope.$parent.fileName = 'Loaded:' + tempName;
            scope.fileread = dataURI;
            if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                //only for avatar
                scope.$parent.saveDataURI(dataURI);
            }
        });
    };

    // We put the Data URI in the image's src attribute
    img.src = datas;
};

app.directive('postrenderAction', postrenderAction);

/* @ngInject */
function postrenderAction($timeout) {
    // ### Directive Interface
    // Defines base properties for the directive.
    const directive = {
        restrict: 'A',
        priority: 101,
        link: link
    };
    return directive;

    // ### Link Function
    // Provides functionality for the directive during the DOM building/data binding stage.
    function link(scope, element, attrs) {
        $timeout(function () {
            scope.$evalAsync(attrs.postrenderAction);
        }, 0);
    }
}