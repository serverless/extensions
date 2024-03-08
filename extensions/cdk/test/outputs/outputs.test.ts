import { execSync } from 'child_process'

describe('Outputs', () => {
  test('build message-publisher', () => {
    execSync('cd test/outputs/fixture/message-publisher && serverless ext developer build', { stdio: 'inherit' })
  })
  test('build cdk runner', () => {
    execSync('serverless ext developer build', { stdio: 'inherit' })
  })
  test('build cdk app', () => {
    execSync('cd test/outputs/fixture/cdk-sqs && npm i', { stdio: 'inherit' })
  })
  test('bootstrap cdk', () => {
    execSync('cd test/outputs/fixture && serverless ext cdk-sqs bootstrap', { stdio: 'inherit' })
  })
  test('deploy service', () => {
    execSync('cd test/outputs/fixture && serverless ext run', { stdio: 'inherit' })
  })
  test('send custom message', () => {
    execSync('cd test/outputs/fixture && serverless ext message-publisher publish-message hello!', { stdio: 'inherit' })
  })
  test('remove services', () => {
    execSync('cd test/outputs/fixture && serverless ext remove', { stdio: 'inherit' })
  })
})
