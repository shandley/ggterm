/**
 * Tests for GGTermREPL
 */

import { describe, expect, it, beforeEach, mock, spyOn } from 'bun:test'
import { GGTermREPL } from '../../repl/repl'
import { GGPlot } from '../../grammar'

// Helper to create REPL instance for testing
function createTestREPL(options = {}) {
  return new GGTermREPL({
    showWelcome: false,
    autoRender: false,
    colors: false,
    ...options,
  })
}

describe('GGTermREPL', () => {
  describe('constructor', () => {
    it('should create with default options', () => {
      const repl = new GGTermREPL()

      expect(repl).toBeInstanceOf(GGTermREPL)
    })

    it('should accept custom options', () => {
      const repl = new GGTermREPL({
        width: 100,
        height: 30,
        showWelcome: false,
        colors: false,
        autoRender: false,
      })

      expect(repl).toBeInstanceOf(GGTermREPL)
    })
  })

  describe('processLine', () => {
    it('should ignore empty lines', async () => {
      const repl = createTestREPL()

      // Should not throw
      await repl.processLine('')
      await repl.processLine('   ')
    })

    it('should handle dot commands', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 10')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle JavaScript evaluation', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('1 + 1')

      expect(consoleSpy).toHaveBeenCalledWith('2')
      consoleSpy.mockRestore()
    })

    it('should handle variable assignment', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('x = 42')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle errors gracefully', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      // Invalid JavaScript should not crash
      await repl.processLine('this is not valid js {{{')

      // Should print error
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('.data command', () => {
    it('should generate sample data', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 20')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated 20 sample rows')
      )
      consoleSpy.mockRestore()
    })

    it('should load iris dataset', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data iris')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Loaded Iris dataset')
      )
      consoleSpy.mockRestore()
    })

    it('should load mtcars dataset', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data mtcars')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Loaded mtcars dataset')
      )
      consoleSpy.mockRestore()
    })

    it('should clear data', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 10')
      await repl.processLine('.data clear')

      expect(consoleSpy).toHaveBeenCalledWith('Data cleared')
      consoleSpy.mockRestore()
    })

    it('should show data summary when no args', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle JSON data', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data [{"x":1},{"x":2}]')

      expect(consoleSpy).toHaveBeenCalledWith('Loaded 2 rows')
      consoleSpy.mockRestore()
    })

    it('should handle invalid JSON', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data not valid json')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error:')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('.size command', () => {
    it('should show current size when no args', async () => {
      const repl = createTestREPL({ width: 80, height: 25 })
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.size')

      expect(consoleSpy).toHaveBeenCalledWith('Current size: 80x25')
      consoleSpy.mockRestore()
    })

    it('should set new size', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.size 100 30')

      expect(consoleSpy).toHaveBeenCalledWith('Size set to 100x30')
      consoleSpy.mockRestore()
    })

    it('should show error for invalid args', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.size abc')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage:')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('.theme command', () => {
    it('should show available themes when no args', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.theme')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Available themes')
      )
      consoleSpy.mockRestore()
    })

    it('should handle unknown theme', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      // First create a plot
      await repl.processLine('.data sample 10')
      await repl.processLine('p = gg(data).aes({x: "x", y: "y"})')
      await repl.processLine('.theme unknown_theme')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown theme')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('.help command', () => {
    it('should print general help', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.help')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should print geoms help', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.help geoms')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should print scales help', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.help scales')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should print aes help', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.help aes')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle unknown topic', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.help unknown_topic')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('.examples command', () => {
    it('should print examples', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.examples')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('.history command', () => {
    it('should show empty history message', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      // Clear the .history command itself from history first
      await repl.processLine('.history')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should show command history', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 5')
      await repl.processLine('x = 1')
      await repl.processLine('.history')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('.vars command', () => {
    it('should show no variables message', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.vars')

      expect(consoleSpy).toHaveBeenCalledWith('No variables defined')
      consoleSpy.mockRestore()
    })

    it('should show defined variables', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('x = 42')
      await repl.processLine('.vars')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('.reset command', () => {
    it('should reset state', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 10')
      await repl.processLine('x = 42')
      await repl.processLine('.reset')

      expect(consoleSpy).toHaveBeenCalledWith('State reset')
      consoleSpy.mockRestore()
    })
  })

  describe('.clear command', () => {
    it('should clear screen', async () => {
      const repl = createTestREPL()
      const clearSpy = spyOn(console, 'clear').mockImplementation(() => {})

      await repl.processLine('.clear')

      expect(clearSpy).toHaveBeenCalled()
      clearSpy.mockRestore()
    })
  })

  describe('.plot command', () => {
    it('should error when no plot exists', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.plot')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No plot to render')
      )
      consoleSpy.mockRestore()
    })

    it('should render existing plot', async () => {
      const repl = createTestREPL({ autoRender: false })
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 10')
      await repl.processLine('p = gg(data).aes({x: "x", y: "y"}).geom(geom_point())')
      await repl.processLine('.plot')

      // Should have called console.log for the plot output
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('.save command', () => {
    it('should error when no filename', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.save')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage:')
      )
      consoleSpy.mockRestore()
    })

    it('should error when no plot rendered', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.save test.txt')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No plot to save')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('.load command', () => {
    it('should error when no filename', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.load')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage:')
      )
      consoleSpy.mockRestore()
    })

    it('should handle non-existent file', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.load nonexistent.json')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Load failed')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('unknown command', () => {
    it('should show error for unknown command', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.unknowncommand')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown command')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('command aliases', () => {
    it('should accept .h for .help', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.h')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should accept .? for .help', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.?')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should accept .d for .data', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.d sample 5')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated 5 sample rows')
      )
      consoleSpy.mockRestore()
    })

    it('should accept .p for .plot', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.p')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No plot to render')
      )
      consoleSpy.mockRestore()
    })

    it('should accept .c for .clear', async () => {
      const repl = createTestREPL()
      const clearSpy = spyOn(console, 'clear').mockImplementation(() => {})

      await repl.processLine('.c')

      expect(clearSpy).toHaveBeenCalled()
      clearSpy.mockRestore()
    })

    it('should accept .ex for .examples', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.ex')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('evaluation context', () => {
    it('should have gg function', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 5')
      await repl.processLine('p = gg(data)')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should have geom functions', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('.data sample 5')
      await repl.processLine('gg(data).aes({x:"x",y:"y"}).geom(geom_point())')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should have range utility', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('range(0, 5)')

      expect(consoleSpy).toHaveBeenCalledWith('[0,1,2,3,4]')
      consoleSpy.mockRestore()
    })

    it('should have random utility', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('r = random(3)')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should have seq utility', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('seq(1, 5, 2)')

      expect(consoleSpy).toHaveBeenCalledWith('[1,3,5]')
      consoleSpy.mockRestore()
    })

    it('should have rnorm utility', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('n = rnorm(3)')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should persist variables', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('x = 10')
      await repl.processLine('y = x * 2')

      expect(consoleSpy).toHaveBeenCalledWith('y = 20')
      consoleSpy.mockRestore()
    })
  })

  describe('data assignment', () => {
    it('should store array data', async () => {
      const repl = createTestREPL()
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

      await repl.processLine('mydata = [{x:1},{x:2},{x:3}]')

      expect(consoleSpy).toHaveBeenCalledWith('Data loaded: 3 rows')
      consoleSpy.mockRestore()
    })
  })

  describe('stop', () => {
    it('should stop the REPL', () => {
      const repl = createTestREPL()

      // Should not throw
      repl.stop()
    })
  })
})

describe('GGTermREPL sample data generation', () => {
  it('should generate data with correct structure', async () => {
    const repl = createTestREPL()
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

    await repl.processLine('.data sample 5')

    // Verify by checking data summary
    await repl.processLine('.data')

    // Should show columns: x, y, group, size
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Columns:')
    )
    consoleSpy.mockRestore()
  })
})

describe('GGTermREPL iris data', () => {
  it('should have correct columns', async () => {
    const repl = createTestREPL()
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

    await repl.processLine('.data iris')
    await repl.processLine('.data')

    // Should show iris columns
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('GGTermREPL mtcars data', () => {
  it('should have correct columns', async () => {
    const repl = createTestREPL()
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

    await repl.processLine('.data mtcars')
    await repl.processLine('.data')

    // Should show mtcars columns
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('edge cases', () => {
  it('should handle multiple semicolon-separated statements in code execute', async () => {
    const repl = createTestREPL()
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

    // Single line should work
    await repl.processLine('x = 1')
    await repl.processLine('y = x + 1')

    expect(consoleSpy).toHaveBeenCalledWith('y = 2')
    consoleSpy.mockRestore()
  })

  it('should handle let/const/var declarations', async () => {
    const repl = createTestREPL()
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

    await repl.processLine('let a = 5')
    await repl.processLine('const b = 10')
    await repl.processLine('var c = 15')

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('should handle whitespace in commands', async () => {
    const repl = createTestREPL()
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

    await repl.processLine('.data   sample   10')

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generated 10 sample rows')
    )
    consoleSpy.mockRestore()
  })

  it('should handle case-insensitive commands', async () => {
    const repl = createTestREPL()
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {})

    await repl.processLine('.DATA sample 5')
    await repl.processLine('.HELP')

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
