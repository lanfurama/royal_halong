import type { ParsedSection } from '../types'

type FormType = 'wedding' | 'mice' | 'general'

interface LeadFormCopy {
  formType: FormType
  heading: string
  description: string
  successMessage: string
}

/**
 * Route -> form liên hệ gắn vào cuối trang.
 *
 * Form là thứ DUY NHẤT bản gốc không còn bản chạy được: endpoint `admin-ajax`
 * của WordPress đã chết nên trong bản clone không có markup form nào để parser
 * suy ra. Vì vậy đây là ánh xạ tường minh chứ không phải trích từ HTML — và
 * phải có, nếu không `components/forms/LeadForm.tsx` dựng xong vẫn không trang
 * nào hiển thị (đúng lớp lỗi "document mồ côi" đã gặp với venue/hall).
 */
export const LEAD_FORM_PAGES: Record<string, LeadFormCopy> = {
  wedding: {
    formType: 'wedding',
    heading: 'Nhận tư vấn tiệc cưới',
    description:
      'Để lại thông tin, bộ phận tiệc cưới của Royal Hạ Long sẽ liên hệ tư vấn thực đơn, sảnh tiệc và báo giá theo đúng ngày bạn dự định tổ chức.',
    successMessage:
      'Cảm ơn bạn. Bộ phận tiệc cưới sẽ liên hệ lại trong thời gian sớm nhất.',
  },
  'royal-international-convention-palace': {
    formType: 'mice',
    heading: 'Yêu cầu báo giá hội nghị',
    description:
      'Cho chúng tôi biết quy mô và thời gian sự kiện, bộ phận hội nghị sẽ gửi phương án sảnh, sơ đồ bàn ghế và báo giá phù hợp.',
    successMessage:
      'Cảm ơn bạn. Bộ phận hội nghị sẽ liên hệ lại trong thời gian sớm nhất.',
  },
}

export function leadFormSection(copy: LeadFormCopy): ParsedSection {
  return {
    _type: 'leadFormSection',
    heading: copy.heading,
    description: copy.description,
    formType: copy.formType,
    successMessage: copy.successMessage,
  }
}
