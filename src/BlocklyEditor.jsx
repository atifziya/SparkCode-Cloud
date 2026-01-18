// src/BlocklyEditor.jsx
import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import 'blockly/javascript';

// Import our updated config
import { arduinoToolbox, initCustomBlocks, initArduinoGenerator, arduinoGenerator } from './blockly-config';

Blockly.setLocale(En);

const BlocklyEditor = ({ onCodeChange }) => {
    const blocklyDiv = useRef(null);
    const workspaceRef = useRef(null);

    useEffect(() => {
        if (!blocklyDiv.current) return;

        // 1. Initialize Custom Blocks & Generators
        initCustomBlocks();
        initArduinoGenerator();

        // 2. Inject Workspace
        // Check if workspace already exists to prevent double injection
        if (!workspaceRef.current) {
            workspaceRef.current = Blockly.inject(blocklyDiv.current, {
                toolbox: arduinoToolbox,
                scrollbars: true,
                trashcan: true,
                grid: { spacing: 20, length: 3, colour: '#444', snap: true },
                zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
                theme: Blockly.Theme.defineTheme('dark', {
                    'base': Blockly.Themes.Classic,
                    'componentStyles': {
                        'workspaceBackgroundColour': '#1e1e1e',
                        'toolboxBackgroundColour': '#252526',
                        'toolboxForegroundColour': '#fff',
                        'flyoutBackgroundColour': '#333',
                        'flyoutForegroundColour': '#ccc',
                        'flyoutOpacity': 1,
                        'scrollbarColour': '#555',
                    }
                })
            });

            // 3. Code Generation Listener
            const generateCode = () => {
                try {
                    if (!arduinoGenerator.definitions_) arduinoGenerator.definitions_ = {};
                    let code = arduinoGenerator.workspaceToCode(workspaceRef.current);
                    const defs = Object.values(arduinoGenerator.definitions_ || {}).join('\n');
                    const finalCode = defs ? `${defs}\n\n${code}` : code;
                    onCodeChange(finalCode);
                } catch (e) {
                    console.error("Generation Error:", e);
                }
            };

            workspaceRef.current.addChangeListener(generateCode);
            
            // Initial resize logic
            setTimeout(() => {
                Blockly.svgResize(workspaceRef.current);
            }, 100);
        }

        const handleResize = () => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
        };
        window.addEventListener('resize', handleResize);
        
        return () => {
             window.removeEventListener('resize', handleResize);
             // Note: We deliberately don't dispose here to prevent React strict mode issues
             // during development, but in production, it's safer.
        };
    }, []);

    return <div ref={blocklyDiv} style={{ width: '100%', height: '100%' }} />;
};

// 🔥 CRITICAL FIX: React.memo prevents re-rendering when Parent state changes (like isCompiling)
export default React.memo(BlocklyEditor);