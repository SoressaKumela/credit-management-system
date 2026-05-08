module.exports = {
  Alert: {
    alert: jest.fn()
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios)
  },
  Linking: {
    openURL: jest.fn()
  },
  StyleSheet: {
    create: (styles) => styles,
    absoluteFill: {},
    absoluteFillObject: {},
    hairlineWidth: 1
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 }))
  },
  Animated: {
    Value: jest.fn(() => ({
      interpolate: jest.fn()
    })),
    View: 'Animated.View',
    timing: jest.fn(() => ({
      start: jest.fn()
    })),
    parallel: jest.fn(() => ({
      start: jest.fn()
    }))
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  KeyboardAvoidingView: 'KeyboardAvoidingView'
};
