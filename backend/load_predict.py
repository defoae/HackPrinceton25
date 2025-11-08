import tensorflow as tf
from keras import models

def load_model():
    return tf.keras.models.load_model('handwriting_model.h5')

def predict(test):
    model = load_model()
    prediction = model.predict(test)
    return prediction.argmax(axis=1)
