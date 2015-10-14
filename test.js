var subject = require('./subject.js')
var mock = require('mock-fs');
subject.inc('',5);
subject.inc('',5);
subject.inc('',undefined);
subject.inc(-7,undefined);
subject.inc(1,undefined);
subject.inc(1,undefined);
subject.weird(6,'','','');
subject.weird(197,'','','');
subject.weird(197,-8,'','');
subject.weird(197,0,'','');
subject.weird(197,0,34,'');
subject.weird(197,0,4143,'');
subject.weird(197,0,4143,'');
subject.weird("strict--173");
subject.weird(197,0,4143,"strict");
subject.weird("strict--591");
subject.weird(197,0,4143,"strict");
subject.weird(197,0,4143,"strict");
subject.weird(197,0,4143,"strict");
mock({"path/fileExists":{"file1":"a.txt"},"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{},"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{"file1":"a.txt"},"pathContent":{"file1":""}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"pathContent":{"file1":""}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{"file1":"a.txt"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
subject.normalize('');
subject.format('','',{"normalize" : true});
subject.format('234-600-9316 x0436','',{"normalize" : true});
subject.blackListNumber('679.957.4518 x302');
subject.blackListNumber("212-554-547");
subject.blackListNumber('679.957.4518 x302');
