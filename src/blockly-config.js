// src/blockly-config.js
import * as Blockly from 'blockly/core';

// 1. Create Custom Generator
export const arduinoGenerator = new Blockly.Generator('Arduino');

// Define Order Precedence
arduinoGenerator.ORDER_ATOMIC = 0;
arduinoGenerator.ORDER_NONE = 99;

// --- CRITICAL FIX: SCRUB FUNCTION ---
// Yeh function batata hai ki ek block ke baad agla block kaise jodna hai.
arduinoGenerator.scrub_ = function(block, code, opt_thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? '' : arduinoGenerator.blockToCode(nextBlock);
    return code + nextCode;
};
// ------------------------------------

arduinoGenerator.addReservedWords(
    'setup,loop,if,else,for,switch,case,while,do,break,continue,return,goto,define,include,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,integer,constants,floating,point,void,boolean,char,unsigned,byte,int,word,long,float,double,string,String,array,static,volatile,const,sizeof,pinMode,digitalWrite,digitalRead,analogReference,analogRead,analogWrite,tone,noTone,millis,micros,delay,delayMicroseconds,min,max,abs,constrain,map,pow,sqrt,sin,cos,tan,randomSeed,random,attachInterrupt,detachInterrupt,interrupts,noInterrupts'
);

// 2. Initialize Generators
export const initArduinoGenerator = () => {
    
    const getStatement = (block, name) => {
        return arduinoGenerator.statementToCode(block, name);
    };
    
    // --- BASE ARDUINO ---
    arduinoGenerator.forBlock['arduino_setup'] = function (block) {
        const statements = getStatement(block, 'SETUP');
        return `void setup() {\n${statements}}\n\n`;
    };

    arduinoGenerator.forBlock['arduino_loop'] = function (block) {
        const statements = getStatement(block, 'LOOP');
        return `void loop() {\n${statements}}\n`;
    };

    arduinoGenerator.forBlock['arduino_delay'] = function (block) {
        const delay = block.getFieldValue('DELAY');
        return `delay(${delay});\n`;
    };

    // --- I/O ---
    arduinoGenerator.forBlock['arduino_pinMode'] = function (block) {
        const pin = block.getFieldValue('PIN');
        const mode = block.getFieldValue('MODE');
        return `pinMode(${pin}, ${mode});\n`;
    };

    arduinoGenerator.forBlock['arduino_digitalWrite'] = function (block) {
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        return `digitalWrite(${pin}, ${state});\n`;
    };

    arduinoGenerator.forBlock['arduino_digital_read'] = function (block) {
        const pin = block.getFieldValue('PIN');
        return [`digitalRead(${pin})`, arduinoGenerator.ORDER_ATOMIC];
    };

    arduinoGenerator.forBlock['arduino_analogWrite'] = function (block) {
        const pin = block.getFieldValue('PIN');
        const value = block.getFieldValue('VALUE');
        return `analogWrite(${pin}, ${value});\n`;
    };

    arduinoGenerator.forBlock['arduino_analog_read'] = function (block) {
        const pin = block.getFieldValue('PIN');
        return [`analogRead(${pin})`, arduinoGenerator.ORDER_ATOMIC];
    };

    // --- SERIAL ---
    arduinoGenerator.forBlock['arduino_serial_begin'] = function (block) {
        const baud = block.getFieldValue('BAUD_RATE');
        return `Serial.begin(${baud});\n`;
    };

    arduinoGenerator.forBlock['arduino_serial_print'] = function (block) {
        const text = block.getFieldValue('TEXT');
        return `Serial.print("${text}");\n`;
    };

    arduinoGenerator.forBlock['arduino_serial_println'] = function (block) {
        const text = block.getFieldValue('TEXT');
        return `Serial.println("${text}");\n`;
    };

    // --- CONTROL ---
    arduinoGenerator.forBlock['arduino_if_else'] = function (block) {
        const ifCond = arduinoGenerator.valueToCode(block, 'IF0', arduinoGenerator.ORDER_NONE) || 'false';
        const ifBranch = getStatement(block, 'DO0');
        let code = `if (${ifCond}) {\n${ifBranch}}\n`;
        
        for (let i = 1; i <= block.elseIfCount_; i++) {
            const elseIfCond = arduinoGenerator.valueToCode(block, 'IF' + i, arduinoGenerator.ORDER_NONE) || 'false';
            const elseIfBranch = getStatement(block, 'DO' + i);
            code += `else if (${elseIfCond}) {\n${elseIfBranch}}\n`;
        }
        if (block.hasElse_) {
            const elseBranch = getStatement(block, 'ELSE');
            code += `else {\n${elseBranch}}\n`;
        }
        return code;
    };

    arduinoGenerator.forBlock['arduino_for'] = function(block) {
        const variable = block.getFieldValue('VAR');
        const from = block.getFieldValue('FROM');
        const to = block.getFieldValue('TO');
        const inc = block.getFieldValue('INCREMENT');
        const branch = getStatement(block, 'DO0');
        return `for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${inc}) {\n${branch}}\n`;
    };

    arduinoGenerator.forBlock['arduino_while'] = function(block) {
        const cond = arduinoGenerator.valueToCode(block, 'WHILE0', arduinoGenerator.ORDER_NONE) || 'false';
        const branch = getStatement(block, 'DO0');
        return `while (${cond}) {\n${branch}}\n`;
    };
    
    // --- MATH & VARS ---
    arduinoGenerator.forBlock['arduino_number'] = function(block) {
        return [block.getFieldValue('NUMBER'), arduinoGenerator.ORDER_ATOMIC];
    };

    arduinoGenerator.forBlock['arduino_text'] = function(block) {
        return [`"${block.getFieldValue('TEXT')}"`, arduinoGenerator.ORDER_ATOMIC];
    };
    
    // --- SERVO ---
    arduinoGenerator.forBlock['arduino_servo_define'] = function(block) {
        arduinoGenerator.definitions_['include_servo'] = '#include <Servo.h>';
        arduinoGenerator.definitions_['define_servo'] = 'Servo myservo;\nint pos = 0;';
        return '';
    };

    arduinoGenerator.forBlock['arduino_servo_setup'] = function(block) {
        const pin = block.getFieldValue('PIN');
        return `myservo.attach(${pin});\n`;
    };
    
    arduinoGenerator.forBlock['arduino_servo_loop'] = function(block) {
        const iDeg = block.getFieldValue('IDEGREE');
        const fDeg = block.getFieldValue('FDEGREE');
        const dly = block.getFieldValue('DELAY');
        return `for(pos = ${iDeg}; pos <= ${fDeg}; pos += 1) { myservo.write(pos); delay(${dly}); }\nfor(pos = ${fDeg}; pos >= ${iDeg}; pos -= 1) { myservo.write(pos); delay(${dly}); }\n`;
    };

    // --- NEOPIXEL ---
    arduinoGenerator.forBlock['neopixel_init'] = function(block) {
        const pin = block.getFieldValue('PIN');
        const num = block.getFieldValue('NUM_LEDS');
        arduinoGenerator.definitions_['include_neopixel'] = '#include <Adafruit_NeoPixel.h>';
        arduinoGenerator.definitions_['define_strip'] = `Adafruit_NeoPixel strip(${num}, ${pin}, NEO_GRB + NEO_KHZ800);`;
        return `strip.begin();\nstrip.show();\n`;
    };

    arduinoGenerator.forBlock['neopixel_set_color'] = function(block) {
        const idx = block.getFieldValue('LED_INDEX');
        const r = block.getFieldValue('RED');
        const g = block.getFieldValue('GREEN');
        const b = block.getFieldValue('BLUE');
        return `strip.setPixelColor(${idx}, strip.Color(${r}, ${g}, ${b}));\nstrip.show();\n`;
    };
};

// 3. Initialize Custom Blocks
export const initCustomBlocks = () => {
    
    // --- SETUP & LOOP ---
    Blockly.Blocks['arduino_setup'] = {
        init: function() {
            this.appendDummyInput().appendField("Setup");
            this.appendStatementInput("SETUP");
            this.setColour(230);
            this.setTooltip("Run once at startup");
        }
    };

    Blockly.Blocks['arduino_loop'] = {
        init: function() {
            this.appendDummyInput().appendField("Loop");
            this.appendStatementInput("LOOP");
            this.setColour(230);
            this.setTooltip("Run repeatedly");
        }
    };

    // --- DELAY ---
    Blockly.Blocks['arduino_delay'] = {
        init: function() {
            this.appendDummyInput().appendField("Delay").appendField(new Blockly.FieldNumber(1000, 0), "DELAY").appendField("ms");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(160);
        }
    };

    // --- PIN MODES ---
    Blockly.Blocks['arduino_pinMode'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("pinMode")
                .appendField(new Blockly.FieldNumber(13), "PIN")
                .appendField(new Blockly.FieldDropdown([["OUTPUT","OUTPUT"],["INPUT","INPUT"]]), "MODE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(160);
        }
    };

    Blockly.Blocks['arduino_digitalWrite'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("digitalWrite")
                .appendField(new Blockly.FieldNumber(13), "PIN")
                .appendField(new Blockly.FieldDropdown([["HIGH","HIGH"],["LOW","LOW"]]), "STATE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(160);
        }
    };
    
    Blockly.Blocks['arduino_digital_read'] = {
        init: function() {
            this.appendDummyInput().appendField("digitalRead").appendField(new Blockly.FieldNumber(2), "PIN");
            this.setOutput(true, "Number");
            this.setColour(160);
        }
    };

    Blockly.Blocks['arduino_analogWrite'] = {
        init: function() {
            this.appendDummyInput().appendField("analogWrite").appendField(new Blockly.FieldNumber(3), "PIN").appendField("Value").appendField(new Blockly.FieldNumber(255), "VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(160);
        }
    };

    Blockly.Blocks['arduino_analog_read'] = {
        init: function() {
            this.appendDummyInput().appendField("analogRead").appendField(new Blockly.FieldNumber(0), "PIN");
            this.setOutput(true, "Number");
            this.setColour(160);
        }
    };

    // --- SERIAL ---
    Blockly.Blocks['arduino_serial_begin'] = {
        init: function() {
            this.appendDummyInput().appendField("Serial.begin").appendField(new Blockly.FieldNumber(9600), "BAUD_RATE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(60);
        }
    };

    Blockly.Blocks['arduino_serial_print'] = {
        init: function() {
            this.appendDummyInput().appendField("Serial.print").appendField(new Blockly.FieldTextInput("Hello"), "TEXT");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(60);
        }
    };

    Blockly.Blocks['arduino_serial_println'] = {
        init: function() {
            this.appendDummyInput().appendField("Serial.println").appendField(new Blockly.FieldTextInput("Hello"), "TEXT");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(60);
        }
    };

    // --- CONTROL ---
    Blockly.Blocks['arduino_if_else'] = {
        init: function() {
            this.appendValueInput('IF0').appendField('if');
            this.appendStatementInput('DO0');
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(210);
            this.setMutator(new Blockly.icons.MutatorIcon(['controls_if_elseif', 'controls_if_else'], this));
        }
    };

    Blockly.Blocks['arduino_for'] = {
        init: function() {
            this.appendDummyInput().appendField("for int").appendField(new Blockly.FieldTextInput("i"), "VAR")
                .appendField("=").appendField(new Blockly.FieldNumber(0), "FROM")
                .appendField("to").appendField(new Blockly.FieldNumber(10), "TO")
                .appendField("step").appendField(new Blockly.FieldNumber(1), "INCREMENT");
            this.appendStatementInput("DO0");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(210);
        }
    };
    
    Blockly.Blocks['arduino_while'] = {
        init: function() {
            this.appendValueInput("WHILE0").appendField("while");
            this.appendStatementInput("DO0");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(210);
        }
    };

    // --- SERVO ---
    Blockly.Blocks['arduino_servo_define'] = {
        init: function(){
            this.appendDummyInput().appendField("Servo Define (Pos 0)");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(290);
        }
    };

    Blockly.Blocks['arduino_servo_setup'] = {
        init: function() {
            this.appendDummyInput().appendField("Servo Attach Pin").appendField(new Blockly.FieldNumber(9), "PIN");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(290);
        }
    };

    Blockly.Blocks['arduino_servo_loop'] = {
        init: function(){
            this.appendDummyInput().appendField("Servo Sweep").appendField("Start").appendField(new Blockly.FieldNumber(0), "IDEGREE")
                .appendField("End").appendField(new Blockly.FieldNumber(180), "FDEGREE")
                .appendField("Speed").appendField(new Blockly.FieldNumber(15), "DELAY");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(290);
        }
    };

    // --- NEOPIXEL ---
    Blockly.Blocks['neopixel_init'] = {
        init: function() {
            this.appendDummyInput().appendField("NeoPixel Init Pin").appendField(new Blockly.FieldNumber(6), "PIN").appendField("LEDs").appendField(new Blockly.FieldNumber(16), "NUM_LEDS");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(300);
        }
    };

    Blockly.Blocks['neopixel_set_color'] = {
        init: function() {
            this.appendDummyInput().appendField("Set Pixel").appendField(new Blockly.FieldNumber(0), "LED_INDEX")
                .appendField("R").appendField(new Blockly.FieldNumber(255), "RED")
                .appendField("G").appendField(new Blockly.FieldNumber(255), "GREEN")
                .appendField("B").appendField(new Blockly.FieldNumber(255), "BLUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(300);
        }
    };
};

// 4. Export Toolbox
export const arduinoToolbox = {
    "kind": "categoryToolbox",
    "contents": [
        {
            "kind": "category",
            "name": "Basics",
            "colour": "230",
            "contents": [
                { "kind": "block", "type": "arduino_setup" },
                { "kind": "block", "type": "arduino_loop" },
                { "kind": "block", "type": "arduino_delay" }
            ]
        },
        {
            "kind": "category",
            "name": "I/O",
            "colour": "160",
            "contents": [
                { "kind": "block", "type": "arduino_pinMode" },
                { "kind": "block", "type": "arduino_digitalWrite" },
                { "kind": "block", "type": "arduino_digital_read" },
                { "kind": "block", "type": "arduino_analogWrite" },
                { "kind": "block", "type": "arduino_analog_read" }
            ]
        },
        {
            "kind": "category",
            "name": "Serial",
            "colour": "60",
            "contents": [
                { "kind": "block", "type": "arduino_serial_begin" },
                { "kind": "block", "type": "arduino_serial_print" },
                { "kind": "block", "type": "arduino_serial_println" }
            ]
        },
        {
            "kind": "category",
            "name": "Control",
            "colour": "210",
            "contents": [
                { "kind": "block", "type": "arduino_if_else" },
                { "kind": "block", "type": "arduino_for" },
                { "kind": "block", "type": "arduino_while" }
            ]
        },
        {
            "kind": "category",
            "name": "Servo",
            "colour": "290",
            "contents": [
                { "kind": "block", "type": "arduino_servo_define" },
                { "kind": "block", "type": "arduino_servo_setup" },
                { "kind": "block", "type": "arduino_servo_loop" }
            ]
        },
        {
            "kind": "category",
            "name": "NeoPixel",
            "colour": "300",
            "contents": [
                { "kind": "block", "type": "neopixel_init" },
                { "kind": "block", "type": "neopixel_set_color" }
            ]
        }
    ]
};