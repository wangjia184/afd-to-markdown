const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simple test runner
async function runTest() {
  try {
    // Import the converter
    const { convertADFToMarkdown } = require('../dist/index.js');

    // Read the test ADF file
    const adfPath = path.join(__dirname, '..', 'adf-example.json');
    const adfContent = fs.readFileSync(adfPath, 'utf8');
    const adf = JSON.parse(adfContent);

    console.log('Converting ADF to Markdown...\n');
    console.log('='.repeat(80));

    // Convert
    const markdown = convertADFToMarkdown(adf);

    // Output the result
    console.log(markdown);

    console.log('='.repeat(80));
    console.log('\n✓ Conversion completed successfully!');

    // Write output to file
    const outputPath = path.join(__dirname, '..', 'output.md');
    fs.writeFileSync(outputPath, markdown, 'utf8');
    console.log(`\nOutput written to: ${outputPath}`);

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// --- media node assertions ---
function runMediaAssertions() {
  const { convertADFToMarkdown } = require('../dist/index.js');

  // mediaSingle: standalone image, no bullet (existing behavior preserved)
  const mediaSingleAdf = {
    type: 'doc', version: 1,
    content: [
      {
        type: 'mediaSingle',
        attrs: { width: 1414, widthType: 'pixel', layout: 'align-start' },
        content: [
          { type: 'media', attrs: {
              type: 'file',
              id: '75160c5a-ffe5-4a40-8e87-5ad6575d0b4a',
              alt: 'Screenshot.png',
              collection: '',
              height: 836, width: 1604
          } }
        ]
      }
    ]
  };
  assert.strictEqual(
    convertADFToMarkdown(mediaSingleAdf),
    '![Screenshot.png](media://75160c5a-ffe5-4a40-8e87-5ad6575d0b4a)',
    'mediaSingle image should render without a bullet'
  );

  // mediaGroup with an image child (alt present) -> bulleted image
  const imageGroupAdf = {
    type: 'doc', version: 1,
    content: [
      { type: 'mediaGroup', content: [
          { type: 'media', attrs: {
              type: 'file',
              id: '75160c5a-ffe5-4a40-8e87-5ad6575d0b4a',
              alt: 'Screenshot.png',
              collection: ''
          } }
      ] }
    ]
  };
  assert.strictEqual(
    convertADFToMarkdown(imageGroupAdf),
    '- ![Screenshot.png](media://75160c5a-ffe5-4a40-8e87-5ad6575d0b4a)',
    'mediaGroup image child should render as a bulleted image'
  );

  // mediaGroup with a file child (no alt) -> bulleted download link (the regression case)
  const fileGroupAdf = {
    type: 'doc', version: 1,
    content: [
      { type: 'mediaGroup', content: [
          { type: 'media', attrs: {
              type: 'file',
              id: '51c09b7e-2bfd-4311-899c-d90f861e0f7b',
              collection: ''
          } }
      ] }
    ]
  };
  assert.strictEqual(
    convertADFToMarkdown(fileGroupAdf),
    '- [file : 51c09b7e-2bfd-4311-899c-d90f861e0f7b](media://51c09b7e-2bfd-4311-899c-d90f861e0f7b)',
    'mediaGroup file child should render as a bulleted download link'
  );

  // mediaGroup with multiple children -> two bulleted lines, single trailing blank line
  const multiGroupAdf = {
    type: 'doc', version: 1,
    content: [
      { type: 'mediaGroup', content: [
          { type: 'media', attrs: {
              type: 'file',
              id: '75160c5a-ffe5-4a40-8e87-5ad6575d0b4a',
              alt: 'Screenshot.png',
              collection: ''
          } },
          { type: 'media', attrs: {
              type: 'file',
              id: '51c09b7e-2bfd-4311-899c-d90f861e0f7b',
              collection: ''
          } }
      ] }
    ]
  };
  assert.strictEqual(
    convertADFToMarkdown(multiGroupAdf),
    '- ![Screenshot.png](media://75160c5a-ffe5-4a40-8e87-5ad6575d0b4a)\n' +
      '- [file : 51c09b7e-2bfd-4311-899c-d90f861e0f7b](media://51c09b7e-2bfd-4311-899c-d90f861e0f7b)',
    'mediaGroup with multiple children should render one bulleted line per item'
  );

  console.log('\n✓ All media assertions passed');
}

runMediaAssertions();