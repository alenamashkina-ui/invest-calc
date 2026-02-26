export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Метод не разрешен' });
    }
  
    const { name, phone } = req.body;
  
    try {
      console.log('Новая заявка с калькулятора:', name, phone);
  
      // Позже здесь будет логика для amoCRM
  
      return res.status(200).json({ success: true, message: 'Заявка успешно отправлена!' });
    } catch (error) {
      console.error('Ошибка при отправке в CRM:', error);
      return res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
  }