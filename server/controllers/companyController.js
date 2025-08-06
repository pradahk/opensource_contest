const Company = require("../models/Company");
const { verifyToken, isAdmin } = require("../config/dbConfig");

// 모든 기업 조회
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.getAll();
    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error("기업 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "기업 목록을 가져오는 중 오류가 발생했습니다."
    });
  }
};

// 특정 기업 조회
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "해당 기업을 찾을 수 없습니다."
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error("기업 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "기업 정보를 가져오는 중 오류가 발생했습니다."
    });
  }
};

// 기업 생성 (관리자만)
exports.createCompany = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "기업명은 필수입니다."
      });
    }

    // 이미 존재하는 기업명인지 확인
    const existingCompany = await Company.findByName(name.trim());
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "이미 존재하는 기업명입니다."
      });
    }

    const companyId = await Company.create({ name: name.trim() });
    const newCompany = await Company.findById(companyId);

    res.status(201).json({
      success: true,
      message: "기업이 성공적으로 생성되었습니다.",
      data: newCompany
    });
  } catch (error) {
    console.error("기업 생성 오류:", error);
    res.status(500).json({
      success: false,
      message: "기업 생성 중 오류가 발생했습니다."
    });
  }
};

// 기업 수정 (관리자만)
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "기업명은 필수입니다."
      });
    }

    // 기업 존재 여부 확인
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: "해당 기업을 찾을 수 없습니다."
      });
    }

    // 다른 기업과 이름이 중복되는지 확인
    const duplicateCompany = await Company.findByName(name.trim());
    if (duplicateCompany && duplicateCompany.id !== parseInt(id)) {
      return res.status(409).json({
        success: false,
        message: "이미 존재하는 기업명입니다."
      });
    }

    const success = await Company.update(id, { name: name.trim() });
    
    if (success) {
      const updatedCompany = await Company.findById(id);
      res.status(200).json({
        success: true,
        message: "기업 정보가 성공적으로 수정되었습니다.",
        data: updatedCompany
      });
    } else {
      res.status(500).json({
        success: false,
        message: "기업 정보 수정에 실패했습니다."
      });
    }
  } catch (error) {
    console.error("기업 수정 오류:", error);
    res.status(500).json({
      success: false,
      message: "기업 정보 수정 중 오류가 발생했습니다."
    });
  }
};

// 기업 삭제 (관리자만)
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // 기업 존재 여부 확인
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: "해당 기업을 찾을 수 없습니다."
      });
    }

    // 기업과 관련된 질문이 있는지 확인
    const companyWithQuestions = await Company.getWithQuestions(id);
    if (companyWithQuestions && companyWithQuestions.question_count > 0) {
      return res.status(400).json({
        success: false,
        message: "해당 기업과 관련된 질문이 있어 삭제할 수 없습니다."
      });
    }

    const success = await Company.delete(id);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: "기업이 성공적으로 삭제되었습니다."
      });
    } else {
      res.status(500).json({
        success: false,
        message: "기업 삭제에 실패했습니다."
      });
    }
  } catch (error) {
    console.error("기업 삭제 오류:", error);
    res.status(500).json({
      success: false,
      message: "기업 삭제 중 오류가 발생했습니다."
    });
  }
};

// 기업별 질문 수 조회
exports.getCompanyWithQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.getWithQuestions(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "해당 기업을 찾을 수 없습니다."
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error("기업 정보 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "기업 정보를 가져오는 중 오류가 발생했습니다."
    });
  }
}; 