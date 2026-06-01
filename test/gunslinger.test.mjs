import assert from 'node:assert/strict'
import test from 'node:test'
import { gunslingerClass } from '../src/data/gunslinger.js'

test('gunslinger is a complete built-in class definition', () => {
  assert.equal(gunslingerClass.id, 'gunslinger')
  assert.equal(gunslingerClass.hitDie, 'd8')
  assert.deepEqual(gunslingerClass.saves, ['敏捷', '魅力'])
  assert.deepEqual(gunslingerClass.weapons, ['简易武器', '军用远程武器'])
  assert.deepEqual(gunslingerClass.armor, ['轻甲'])
  assert.equal(gunslingerClass.skillChoices.count, 2)
  assert.equal(gunslingerClass.classProgression.length, 20)
  assert.equal(gunslingerClass.subclasses.length, 6)
})

test('gunslinger progression includes its required choice slots', () => {
  const choicesAt = level =>
    gunslingerClass.progression.find(entry => entry.level === level)?.choices ?? []

  assert.ok(choicesAt(1).some(choice => choice.kind === 'skillProficiency'))
  assert.ok(choicesAt(1).some(choice => choice.kind === 'fightingStyleFeat'))
  assert.ok(choicesAt(3).some(choice => choice.kind === 'subclass'))

  for (const level of [4, 8, 12, 16, 19]) {
    assert.ok(choicesAt(level).some(choice => choice.kind === 'generalFeat'))
  }
})

test('spellshot subclass exposes wizard spell progression', () => {
  const spellshot = gunslingerClass.subclasses.find(subclass => subclass.id === 'spellshot')

  assert.ok(spellshot)
  assert.equal(spellshot.spellList, 'wizard')
  assert.equal(spellshot.spellcastingAbility, '智力')
  assert.deepEqual(
    spellshot.spellcastingProgression.find(row => row.level === 3),
    { level: 3, cantrips: 2, prepared: 3, slots: { 1: 2 } }
  )
  assert.deepEqual(
    spellshot.spellcastingProgression.find(row => row.level === 20),
    { level: 20, cantrips: 3, prepared: 13, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } }
  )
})
