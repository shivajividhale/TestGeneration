var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}

	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}

var engine = Random.engines.mt19937().autoSeed();

function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}

function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists':{file1: 'a.txt'}
	},
	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content'
		}
	}
};



function generateTestCases()
{

	var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
	for ( var funcName in functionConstraints )
	{
		var params = {};

		// initialize params
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			//params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
			params[paramName] = '\'\'';
		}

		//console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });
		console.log("file with contents "+fileWithContent);
		console.log("path exists "+pathExists);
		console.log("For "+funcName);
		for( var c = 0; c < constraints.length; c++ )
		{
			var constraint = constraints[c];
			//console.log("Constraint: "+JSON.stringify(constraint));
			console.log(constraint.expression);
			if( params.hasOwnProperty( constraint.ident ) ){
				console.log("indent: "+constraint.ident+" value: "+constraint.value);
				params[constraint.ident]=constraint.value;//constraint.value;

				if (constraint.value == 'undefined' && constraint.kind == 'integer'){
					params[constraint.ident]=createConcreteIntegerValue(0,10);
					var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
					content += "subject.{0}({1});\n".format(funcName, args );
				}

				if(constraint.operator == '==' && constraint.kind == 'integer')
				{
					var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
					content += "subject.{0}({1});\n".format(funcName, args );
					params[constraint.ident]=createConcreteIntegerValue(1,10);

					params[constraint.ident] = constraint.value;
					var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
					content += "subject.{0}({1});\n".format(funcName, args );
					continue;
				}

				if(constraint.operator == '<' && constraint.kind == 'integer')
				{
					params[constraint.ident]=createConcreteIntegerValue(0,constraint.value-1);
					args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
					content += "subject.{0}({1});\n".format(funcName, args );

					params[constraint.ident]=createConcreteIntegerValue(1,constraint.value);
					var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");

					content += "subject.{0}({1});\n".format(funcName, args );
				}

				if(constraint.operator == '>' && constraint.kind == 'integer')
				{
					params[constraint.ident]=createConcreteIntegerValue(0,constraint.value);
					var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
					content += "subject.{0}({1});\n".format(funcName, args );

					params[constraint.ident]=createConcreteIntegerValue(1,constraint.value);
					args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
					content += "subject.{0}({1});\n".format(funcName, args );
					continue;

				}
			}
			//Test for lesser value
			//console.log(params[constraint.indent]);
			// plug-in values for parameters

			// Prepare function arguments.
			// Bonus...generate constraint variations test cases....
		}
		var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
		console.log("Params: "+JSON.stringify(params)+"Arguments: "+args+"Key: "+JSON.stringify(params));
		if( pathExists || fileWithContent )
		{
			content += generateMockFsTestCases(pathExists,fileWithContent,funcName, args,true);
			content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, args,true);
			content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, args,true);
			content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args,true);
		}
		else
		{
			// Emit simple test case.
			content += "subject.{0}({1});\n".format(funcName, args );
			console.log("Args: "+args);
			//console.log(content);
		}

	}


	fs.writeFileSync('test.js', content, "utf8");

}

function generateMockFsTestCases (pathExists,fileWithContent,funcName,args, recursion)
{
	var testCase = "";
	// Build mock file system based on constraints.
	var mergedFS = {};
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname];
		console.log("merge attr"+ JSON.stringify(mergedFS));}
	}
	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}

	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";
	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	//testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	console.log(testCase);
	var tempPathExists = mockFileLibrary.pathExists['path/fileExists'];
	if(pathExists && recursion){
		mockFileLibrary.pathExists['path/fileExists']={};
		testCase += generateMockFsTestCases(pathExists,fileWithContent,funcName,args, false);
	}
	mockFileLibrary.pathExists['path/fileExists']=tempPathExists;

	var tempFileWithContent = mockFileLibrary.fileWithContent['pathContent'].file1;
	if(fileWithContent && recursion){
		mockFileLibrary.fileWithContent['pathContent'].file1 = "";
		testCase += generateMockFsTestCases(pathExists,fileWithContent,funcName,args, false);
	}
	mockFileLibrary.fileWithContent['pathContent'].file1 = tempFileWithContent;
	return testCase;
}

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);
	//console.log(result);
	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && child.operator == "==")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						console.log("Child's range: "+JSON.stringify(child.range));
						var expression = buf.substring(child.range[0], child.range[1]);
						console.log("Buf:  child: {0} expression: {1}".format(JSON.stringify(child)),expression);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						console.log("Righthand :"+rightHand);
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if(child.type === 'BinaryExpression' && child.operator == "<")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						functionConstraints[funcName].constraints.push(
							new Constraint(
								{
									ident: child.left.name,
									value: rightHand,
									funcName: funcName,
									kind: "integer",
									operator : child.operator,
									expression: expression
								}));
					}
				}

				if(child.type === 'BinaryExpression' && child.operator == ">")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						functionConstraints[funcName].constraints.push(
							new Constraint(
								{
									ident: child.left.name,
									value: rightHand,
									funcName: funcName,
									kind: "integer",
									operator : child.operator,
									expression: expression
								}));
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

			});

			//console.log( functionConstraints[funcName]);

		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();
